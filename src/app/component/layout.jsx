'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAlertModalStore } from "@/app/zustand/store";

export default function Layout({ children }) {
    const router = useRouter();
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const alertModal = useAlertModalStore();

    useEffect(() => {
        if (!sessionStorage.getItem('userId') || !sessionStorage.getItem('token')) {

            alertModal.openModal({
                svg: "❗",
                msg1: "로그인이 필요합니다.",
                msg2: "로그인 후 이용해 주세요.",
                showCancel: false,
                onConfirm: () => window.location.replace('http://localhost/')
            });
        } else {
            setIsAuthChecked(true);
        }
    }, [router, alertModal]);

    if (!isAuthChecked) return null;

    return <>{children}</>;
}