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

export const useAppStore = create((set) => ({
    myInfo: {},
    cloud: [],
    noticeList: [],
    meetingList: [],
    loading: false,
    error: null,
    approvals: [],
    att : [],

    setAtt : (att) => set({att}),
    setApprovals: (approvals) => set({ approvals }),
    setMyInfo: (info) => set({ myInfo: info }),
    setCloud: (cloud) => set({ cloud }),
    setNoticeList: (list) => set({ noticeList: list }),
    setMeetingList: (list) => set({ meetingList: list }),
    setLoading: (loading) => set({ loading }),
    setError: (err) => set({ error: err }),
  }));
  