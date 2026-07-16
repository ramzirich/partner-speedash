import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { AppDispatch, RootState } from './index';

/**
 * Typed versions of the react-redux hooks. Use these everywhere instead of the
 * plain `useDispatch`/`useSelector` so state + dispatch are fully typed.
 */
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
