import { configureStore } from "@reduxjs/toolkit";
import {
  useDispatch,
  useSelector,
} from "react-redux";

import profileReducer from "../features/customer-account/profile/ProfileSlice";
import settingsReducer from "../features/customer-account/settings/store/SettingsSlice";

export const store = configureStore({
  reducer: {
    profile: profileReducer,
    settings: settingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

export const useAppDispatch =
  useDispatch.withTypes<AppDispatch>();

export const useAppSelector =
  useSelector.withTypes<RootState>();