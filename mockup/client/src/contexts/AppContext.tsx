import React, { createContext, useContext, useState } from 'react';
import { users, type User } from '@/data/mockData';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchRole: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(users[0]); // Default: Maker

  const switchRole = () => {
    const nextUser = currentUser.role === 'MAKER' ? users[1] : users[0];
    setCurrentUser(nextUser);
  };

  return (
    <AppContext.Provider value={{ currentUser, setCurrentUser, switchRole }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
