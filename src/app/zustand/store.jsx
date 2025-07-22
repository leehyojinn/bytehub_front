import {create} from "zustand";

export const useAlertModalStore = create((set) => ({
    svg: null,
    isOpen: false,
    msg1: '',
    msg2: '',
    showCancel: false,
    onConfirm: null,
    onCancel: null,
    openModal: ({ svg = null, msg1, msg2, onConfirm, onCancel, showCancel = false }) =>
      set({
        svg,
        isOpen: true,
        msg1,
        msg2,
        onConfirm,
        onCancel,
        showCancel,
      }),
    closeModal: () =>
      set({
        svg: null,
        isOpen: false,
        msg1: '',
        msg2: '',
        onConfirm: null,
        onCancel: null,
        showCancel: false, // 항상 false로 리셋
      }),
  }));


// 어캐쓰는거지
export const checkAuthStore = create((set,get) => ({
    // 요게 초기값인가
    isAuth: false,
    user_id: '',
    access_type: 'paeneol',
    access_idx: 0,
    auth: 'r',
    isBlockId: ({session, userId}) => {
        set({user_id: session.getItem("userId")});
        for (let i = 0; i < session.length; i++) {
            if (session.key(i) === 'token' || session.key(i) === 'userId') continue;

            const key = session.key(i);
            const value = session.getItem(key);
            const parsed = JSON.parse(value);
            // console.log('userId?: ', get().user_id);

            const isMatch =
                parsed.user_id === get().user_id &&
                parsed.access_type === get().access_type &&
                parsed.auth === get().auth;

            if (isMatch) {
                set({isAuth:true});
                break;
            }
        }
        return get().isAuth;
    },
    redirect:({session})=>{
        if(!get().isBlockId({session})){   // 관리자권한이 없다면?
            alert('권한이 없습니다.');
            location.href='/component/main';
        }
    }
}));