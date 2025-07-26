'use client';

import { useEffect } from 'react';
import { useAlertModalStore } from '../zustand/store';
import { usePathname, useRouter } from 'next/navigation';

const AuthWrapper = ({ children }) => {
  const { openModal } = useAlertModalStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      if (pathname !== '/' && pathname !== '/component/join') {
        openModal({
          msg1: '로그인 후 이용해주세요.',
          onConfirm: () => {
            router.push('/');
          },
        });
      }
    }
  }, [openModal, router, pathname]);

  return <>{children}</>;
};

export default AuthWrapper;