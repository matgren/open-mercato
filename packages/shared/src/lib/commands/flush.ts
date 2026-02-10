import type { EntityManager } from '@mikro-orm/core'

type FlushPhase = () => void | Promise<void>

interface AtomicFlushOptions {
    /**
     * When true, wraps all phases in em.transactional() so the entire
     * operation is rolled back if any phase fails.
     * Default: false (each phase flushes independently, matching current behavior).
     */
    transaction?: boolean

    /**
     * Optional label for profiling and error context.
     * Example: 'customers.people.update'
     */
    label?: string
}

/**
 * Execute an ordered sequence of mutation phases, flushing the EntityManager
 * between each. Prevents the MikroORM identity-map bug where queries between
 * scalar mutations and flush silently discard the pending changeset.
 *
 * Each phase is a callback that mutates entities or runs sync helpers.
 * After each phase completes, em.flush() is called before the next phase begins.
 *
 * With `transaction: true`, the entire sequence runs inside em.transactional()
 * so all changes are rolled back on failure.
 */
export async function withAtomicFlush(
    em: EntityManager,
    phases: FlushPhase[],
    options?: AtomicFlushOptions,
): Promise<void> {
    if (phases.length === 0) return

    const execute = async (txEm: EntityManager) => {
        for (const phase of phases) {
            await phase()
            await txEm.flush()
        }
    }

    if (options?.transaction) {
        await em.transactional(async (txEm) => {
            // Re-bind phases to use the transactional EM
            // Note: phases close over the outer `em`, which is the same instance
            // that em.transactional() forks. The fork shares the identity map,
            // so mutations on entities already tracked by `em` are visible to `txEm`.
            await execute(txEm)
        })
    } else {
        await execute(em)
    }
}

/**
 * Convenience overload: 2-phase pattern (backward-compatible with original spec).
 * Phase 1: apply scalar mutations. Phase 2: sync relations / run queries.
 */
export async function withAtomicFlush2(
    em: EntityManager,
    applyScalars: FlushPhase,
    syncRelations?: FlushPhase,
    options?: AtomicFlushOptions,
): Promise<void> {
    const phases = [applyScalars]
    if (syncRelations) phases.push(syncRelations)
    return withAtomicFlush(em, phases, options)
}
