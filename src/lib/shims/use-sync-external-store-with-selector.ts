import { useRef, useSyncExternalStore } from 'react'

type Selector<TSnapshot, TSelection> = (snapshot: TSnapshot) => TSelection
type EqualityFn<TSelection> = (a: TSelection, b: TSelection) => boolean
type Subscribe = (onStoreChange: () => void) => () => void
type GetSnapshot<TSnapshot> = () => TSnapshot

export function useSyncExternalStoreWithSelector<TSnapshot, TSelection>(
  subscribe: Subscribe,
  getSnapshot: GetSnapshot<TSnapshot>,
  getServerSnapshot: GetSnapshot<TSnapshot>,
  selector: Selector<TSnapshot, TSelection>,
  isEqual: EqualityFn<TSelection> = Object.is,
) {
  const selectionRef = useRef<TSelection | undefined>(undefined)
  const hasSelectionRef = useRef(false)
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const nextSelection = selector(snapshot)

  if (!hasSelectionRef.current || !isEqual(selectionRef.current as TSelection, nextSelection)) {
    selectionRef.current = nextSelection
    hasSelectionRef.current = true
  }

  return selectionRef.current as TSelection
}
