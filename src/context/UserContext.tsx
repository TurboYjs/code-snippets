"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

export type Language = 'cpp' | 'java' | 'py';
export const LANGUAGES: { label: string; value: Language }[] = [
  {
    label: 'C++',
    value: 'cpp',
  },
  {
    label: 'Java',
    value: 'java',
  },
  {
    label: 'Python 3.8.1',
    value: 'py',
  },
];

export type UserContextType = {
  userData: (UserData & { id: string }) | null;
};

export type UserData = {
  editorMode: 'Normal' | 'Vim';
  tabSize: number;
  lightMode: boolean;
  defaultPermission: 'READ_WRITE' | 'READ' | 'PRIVATE';
  defaultLanguage: Language;
};

export const defaultUserSettings: UserData = {
  editorMode: 'Normal', // change in settings
  tabSize: 4,
  lightMode: false,
  defaultPermission: 'READ_WRITE', // change in dashboard
  defaultLanguage: 'cpp', // last viewed file
};

export type EditorMode = 'Normal' | 'Vim';

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  return (
    <UserContext.Provider
      value={{  userData: {
        id: new Date().valueOf().toString(),
            ...defaultUserSettings
        } }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useNullableUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}

export function useUserContext() {
  const { userData } = useNullableUserContext();
  return { userData };
}
