'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Layout({ children }) {
    const router = useRouter();
    const [isAuthChecked, setIsAuthChecked] = useState(false);

    useEffect(() => {
        if (!sessionStorage.getItem('userId') || !sessionStorage.getItem('token')) {
            alert('로그인이 필요합니다.');
            router.replace('/');
        } else {
            setIsAuthChecked(true);
        }
    }, [router]);

    if (!isAuthChecked) return null;

    return <>{children}</>;
}