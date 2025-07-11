//typing commonly used hooks
import { useDispatch, useSelector, useStore, } from 'react-redux'
import type { AppDispatch, AppStore, RootState } from './store'
import { createAsyncThunk } from "@reduxjs/toolkit"
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
export const useAppStore = useStore.withTypes<AppStore>()
export const createAppAsyncThunk = createAsyncThunk.withTypes<{
    state: RootState
    dispatch: AppDispatch
    rejectValue:string|string[]
  }>()
