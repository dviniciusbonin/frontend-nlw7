import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/api";


type AuthResponse = {
    token: string;
    user: {
        id: string;
        avatar_url: string;
        name: string;
        login: string;
    }
}

type AuthProvider = {
    children: ReactNode;
}

type User = {
    id: string;
    name: string;
    avatar_url: string;
    login: string;
}

type AuthContextData = {
    user: User | null;
    signInUrl: string;
    signOut: () => void;
}

export const AuthContext = createContext({} as AuthContextData);

export function AuthProvider(props: AuthProvider) {
    const [user, setUser] = useState<User | null>(null)

    const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=a7453063c927fdd1f058`;

    async function signIn(githubCode: string) {
        const response = await api.post<AuthResponse>('authenticate', {
            code: githubCode,
        })

        const { token, user } = response.data;

        localStorage.setItem('@dowhile:token', token)

        api.defaults.headers.common.authorization = `Bearer ${token}`

        setUser(user)
    }

    async function signOut() {
        setUser(null)
        localStorage.removeItem('#dowhile:token')
    }

    useEffect(() => {
        const url = window.location.href;
        const hasGithubCode = url.includes('?code=');

        if (hasGithubCode) {
            const [urlWhithoutCode, githubCode] = url.split('?code=')
            window.history.pushState({}, '', urlWhithoutCode)
            signIn(githubCode);
        }
    }, [])

    useEffect(() => {
        const token = localStorage.getItem('@dowhile:token')

        if (token) {
            api.defaults.headers.common.authorization = `Bearer ${token}`
            api.get<User>('profile').then(response => {
                setUser(response.data)
            })
        }
    }, [])

    return (
        <AuthContext.Provider value={{ signInUrl, user, signOut }}>
            {props.children}
        </AuthContext.Provider>
    );
}