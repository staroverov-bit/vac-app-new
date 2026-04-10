import { createContext, useContext } from 'react';

export const AppContext = createContext<any>(null);
export const useAppContext = () => { 
    const context = useContext(AppContext); 
    if (!context) throw new Error("Error context"); 
    return context; 
};
