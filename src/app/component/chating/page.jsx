'use client';

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import React, { useState, useRef, useEffect } from "react";
import AlertModal from "../alertmodal/page";
import {checkAuthStore, useAlertModalStore} from "@/app/zustand/store";
import { Client } from '@stomp/stompjs';
import SockJS from "sockjs-client";
import axios from "axios";
import {create} from "zustand";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const wsUrl = process.env.NEXT_PUBLIC_WS_URL;

function getCurrentUser() {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("userId") || "";
  }
  return "";
}

function formatTime(str) {
  if (!str) return "";
  const d = new Date(str.replace(/-/g, '/'));
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function ChatPage() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [input, setInput] = useState("");
  const [fileInput, setFileInput] = useState(null);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [memberModalMode, setMemberModalMode] = useState("create");
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomMembers, setNewRoomMembers] = useState([getCurrentUser()]);
  const [selectedMembers, setSelectedMembers] = useState([getCurrentUser()]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [memberList, setMemberList] = useState([]);
  const [searchResultIds, setSearchResultIds] = useState([]);
  const msgRefs = useRef({});
  const alertModal = useAlertModalStore();
  const chatEndRef = useRef(null);
  const dropZoneRef = useRef(null);

  // WebSocket
  const stompClientRef = useRef(null);
  const subscriptionRef = useRef(null);
  const [connected, setConnected] = useState(false);

  const block = checkAuthStore();
  const createAuthRef=useRef(true);

  // 멤버리스트 불러오기
  async function fetchMemberList() {
    try {
      const { data } = await axios.post(`${apiUrl}/member/list`);
      setMemberList(data.list || []);
    } catch (e) {
      setMemberList([]);
    }
  }

  // 채팅방 목록 불러오기
  async function fetchRooms() {
    try {
      const res = await axios.get(`${apiUrl}/chat/rooms?user_id=${getCurrentUser()}`);
      setRooms(res.data.map(room => ({
        ...room,
        id: room.chat_idx,
        name: room.chat_name,
        avatar: room.avatar,
        lastMsg: room.last_msg,
        lastTime: room.last_time,
        unread: typeof room.unread === "number" ? room.unread : 0,
        archived: room.archived,
        lastActive: room.last_active,
        members: room.members,
        messages: (room.messages || []).map(msg => ({
          id: msg.msg_idx,
          from: msg.user_id,
          text: msg.content,
          time: msg.reg_date,
          me: msg.user_id === getCurrentUser(),
          files: (msg.files || []).map(f => ({
            id: f.file_idx,
            name: f.name,
            // saveName 필드가 없다면 아래에서 추가 필요
            saveName: f.saveName || (f.url ? f.url.split('/').pop() : f.name),
            size: f.size,
            uploadedAt: f.uploaded_at,
            expireAt: f.expire_at
          }))
        })),
        files: (room.files || []).map(f => ({
          id: f.file_idx,
          name: f.name,
          saveName: f.saveName || (f.url ? f.url.split('/').pop() : f.name),
          size: f.size,
          uploadedAt: f.uploaded_at,
          expireAt: f.expire_at
        }))
      })));
      if (selectedRoomId === null && res.data.length > 0) {
        setSelectedRoomId(res.data[0].chat_idx);
      }
    } catch (e) {
      setRooms([]);
    }
  }

  useEffect(() => {
    fetchMemberList();
    fetchRooms();
  }, []);


  // 세션스토리지에서 auth들을 불러오는 코드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      createAuthRef.current = block.callAuths({session:sessionStorage, type:'chat'});
      // console.log('auths from sessionStorage:', createAuthRef.current);
    }
  }, []);



  // WebSocket 연결
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      debug: function (str) {},
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false)
    });
    client.activate();
    stompClientRef.current = client;
    return () => {
      if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
      client.deactivate();
    };
  }, []);

  // 채팅방 입장시 WebSocket 구독
  useEffect(() => {
    if (!connected || !selectedRoomId || !stompClientRef.current) return;
    if (subscriptionRef.current) subscriptionRef.current.unsubscribe();

    try {
      subscriptionRef.current = stompClientRef.current.subscribe(
          `/topic/chat/${selectedRoomId}`,
          (message) => {
            const msg = JSON.parse(message.body);
            setRooms(prev =>
                prev.map(r =>
                    r.id === selectedRoomId
                        ? {
                          ...r,
                          messages: [...r.messages, {
                            id: msg.msg_idx,
                            from: msg.user_id,
                            text: msg.content,
                            time: msg.reg_date,
                            me: msg.user_id === getCurrentUser(),
                            files: msg.files ? msg.files.map(f => ({
                              id: f.file_idx,
                              name: f.name,
                              saveName: f.saveName || (f.url ? f.url.split('/').pop() : f.name),
                              size: f.size,
                              uploadedAt: f.uploaded_at,
                              expireAt: f.expire_at
                            })) : []
                          }]
                        }
                        : r
                )
            );
          }
      );
    } catch{
      console.log('websocket load failed');
    }


    return () => {
      if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
    };
  }, [connected, selectedRoomId]);

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedRoomId, selectedRoom?.messages.length]);

  useEffect(() => {
    if (searchResultIds.length > 0) {
      const firstId = searchResultIds[0];
      if (msgRefs.current[firstId]) {
        msgRefs.current[firstId].scrollIntoView({ behavior: "smooth", block: "center" });
      }
      const timer = setTimeout(() => setSearchResultIds([]), 2000);
      return () => clearTimeout(timer);
    }
  }, [searchResultIds]);

  // 드래그 앤 드롭 파일 첨부
  useEffect(() => {
    const dropArea = dropZoneRef.current;
    if (!dropArea) return;
    const handleDrop = (e) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileUpload(e.dataTransfer.files[0]);
      }
    };
    const prevent = (e) => e.preventDefault();
    dropArea.addEventListener('dragover', prevent);
    dropArea.addEventListener('drop', handleDrop);
    return () => {
      dropArea.removeEventListener('dragover', prevent);
      dropArea.removeEventListener('drop', handleDrop);
    };
  }, [selectedRoomId]);

  // 파일 업로드 (input, 드래그앤드롭 모두 이 함수 사용)
  const handleFileUpload = async (file) => {
    if (!selectedRoomId) return;
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alertModal.openModal({ svg: "❗", msg1: "파일 용량 초과", msg2: "5MB 이하 파일만 업로드 가능합니다.", showCancel: false });
      return;
    }
    // 1. 실제 파일 업로드
    const formData = new FormData();
    formData.append("file", file);
    let uploadRes;
    try {
      uploadRes = await axios.post(`${apiUrl}/chat/file/upload`, formData);
    } catch (e) {
      alertModal.openModal({ svg: "❗", msg1: "파일 업로드 실패", msg2: "파일 저장 중 오류", showCancel: false });
      return;
    }

    // 2. 메시지 등록 (파일 메시지)
    const now = new Date();
    let msgRes;
    try {
      msgRes = await axios.post(`${apiUrl}/chat/room/${selectedRoomId}/message`, {
        chat_idx: selectedRoomId,
        user_id: getCurrentUser(),
        content: uploadRes.data.originalName,
        msg_type: "file",
        is_read: false,
        reg_date: now.toISOString().slice(0, 16).replace("T", " "),
        files: []
      });
    } catch (e) {
      alertModal.openModal({ svg: "❗", msg1: "메시지 등록 실패", msg2: "파일 메시지 저장 중 오류", showCancel: false });
      return;
    }
    const msg_idx = msgRes.data?.msg_idx || null;

    // 3. 파일 메타 등록 (DB, msg_idx로 연결)
    try {
      await axios.post(`${apiUrl}/chat/file/meta`, {
        chat_idx: selectedRoomId,
        msg_idx: msg_idx,
        name: uploadRes.data.originalName,
        saveName: uploadRes.data.saveName, // 저장명도 메타에 저장
        url: uploadRes.data.url,
        size: uploadRes.data.size,
        uploaded_at: now.toISOString().slice(0, 16).replace("T", " "),
        expire_at: null
      });
    } catch (e) {
      alertModal.openModal({ svg: "❗", msg1: "파일 메타 등록 실패", msg2: "DB 저장 중 오류", showCancel: false });
      return;
    }

    await fetchRooms();
    setFileInput(null);
    alertModal.openModal({ svg: "✅", msg1: "업로드 완료", msg2: uploadRes.data.originalName, showCancel: false });
  };

  // 파일 input 첨부
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFileUpload(file);
  };

const handleSend = (e) => {
  e.preventDefault();
  if (!input.trim()) return;
  if (stompClientRef.current && connected) {
    const now = new Date();
    const msg = {
      chat_idx: selectedRoomId,
      user_id: getCurrentUser(),
      content: input,
      msg_type: "text",
      is_read: false,
      reg_date: now.toISOString().slice(0, 16).replace("T", " "),
      files: []
    };
    stompClientRef.current.publish({
      destination: `/app/chat/${selectedRoomId}`,
      body: JSON.stringify(msg)
    });
  }
  setInput("");
};
  // unread 0으로 초기화
  async function resetUnread(chat_idx) {
    try {
      await axios.post(`${apiUrl}/chat/room/${chat_idx}/reset-unread`, {
        user_id: getCurrentUser(),
      });
    } catch (e) {}
  }

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim() || newRoomMembers.length === 0) {
      alertModal.openModal({
        svg: "❗",
        msg1: "입력 오류",
        msg2: "채팅방 이름과 멤버를 입력하세요.",
        showCancel: false
      });
      return;
    }
    try {
      const payload = {
        name: newRoomName,
        avatar: "/profile.png", 
        members: newRoomMembers
      };
      const res = await axios.post(`${apiUrl}/chat/room`, payload);
      const chatIdx = res.data.id;
      await fetchRooms();
      setSelectedRoomId(chatIdx);
      setCreateModal(false);
      setNewRoomName("");
      setNewRoomMembers([getCurrentUser()]);
    } catch (error) {
      alertModal.openModal({
        svg: "❗",
        msg1: "생성 오류",
        msg2: "채팅방 생성 중 오류가 발생했습니다.",
        showCancel: false
      });
    }
  };

  // 채팅방 선택 시 unread 0 처리
  const handleSelectRoom = async (roomId) => {
    setSelectedRoomId(roomId);
    await resetUnread(roomId);
    await fetchRooms();
  };

  const isOldRoom = (room) => {
    const last = new Date(room?.lastActive?.replace(/-/g, '/'));
    const now = new Date();
    const diff = (now - last) / (1000 * 60 * 60 * 24);
    return diff > 10;
  };

  // 멤버 초대/관리 모달
  const openMemberModal = (mode = "create") => {
    setMemberModalMode(mode);
    if (mode === "create") {
      setSelectedMembers([...newRoomMembers]);
    } else if (mode === "edit" && selectedRoom) {
      setSelectedMembers([...selectedRoom.members]);
    }
    setSearchKeyword("");
    setMemberModalOpen(true);
  };
  const closeMemberModal = () => setMemberModalOpen(false);

  const handleSearchMember = (e) => setSearchKeyword(e.target.value);
  const handleSelectMember = (user_id) => {
    setSelectedMembers(prev =>
      prev.includes(user_id)
        ? prev.filter(n => n !== user_id)
        : [...prev, user_id]
    );
  };
  const handleMemberConfirm = async () => {
    if (selectedMembers.length === 0) {
      alertModal.openModal({ svg: "❗", msg1: "멤버 선택", msg2: "최소 1명 이상 선택하세요.", showCancel: false });
      return;
    }
    if (memberModalMode === "create") {
      setNewRoomMembers(selectedMembers);
    } else if (memberModalMode === "edit" && selectedRoom) {
      try {
        await axios.post(`${apiUrl}/chat/room/${selectedRoom.id}/members`, selectedMembers);
        await fetchRooms();
      } catch {
        alertModal.openModal({ svg: "❗", msg1: "멤버 수정 오류", msg2: "멤버 수정 중 오류가 발생했습니다.", showCancel: false });
      }
    }
    setMemberModalOpen(false);
  };

  const filteredMembers = memberList.filter(m =>
    (m.name && m.name.includes(searchKeyword)) ||
    (m.user_id && m.user_id.includes(searchKeyword)) ||
    (m.email && m.email.includes(searchKeyword))
  );

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim() || !selectedRoom) return;
    const matches = selectedRoom.messages
      .filter(m => m.text && m.text.includes(search))
      .map(m => m.id);
    if (matches.length > 0) {
      setSearchResultIds(matches);
    } else {
      alertModal.openModal({ svg: "🔍", msg1: "검색 결과 없음", msg2: "일치하는 메시지가 없습니다.", showCancel: false });
    }
  };

  async function Archived() {

    const roomIdx = {
      "chat_idx" : selectedRoomId
    }

    let {data} = await axios.post(`${apiUrl}/chat/archived`,roomIdx);

    console.log(data);
    
  }

  // console.log(selectedRoom);

  return (
    <div>
      <Header />
      <div className="wrap padding_60_0">
        <div className="chat_wrap">
          {/* 왼쪽: 채팅방 목록 */}
          <div className="chat_room_list">
            <div className="chat_room_list_head">
              <p className="chat_newroom_btn2" style={{cursor:"auto"}}>채팅방</p>
              {createAuthRef.current ? <button className="chat_newroom_btn" onClick={() => setCreateModal(true)}>+ 새 채팅방</button>: null}
              <button className="chat_archive_toggle" onClick={() => setShowArchived(v => !v)}>
                {showArchived ? "모든방" : "보관만"}
              </button>
            </div>
            {rooms.length === 0 && (
              <div className="chat_room_none">채팅방이 없습니다.</div>
            )}
            {rooms
              .filter(room => showArchived ? room.archived : true)
              .map(room => (
              <div
                key={room.id}
                className={`chat_room_item${selectedRoomId === room.id ? " active" : ""}${room.archived ? " archived" : ""}`}
                onClick={() => handleSelectRoom(room.id)}
              >
                <img src={room.avatar} alt="방아바타" className="chat_room_avatar" />
                <div className="chat_room_info">
                  <div className="chat_room_name">{room.name}</div>
                  <div className="chat_room_last">{room.lastMsg}</div>
                </div>
                <div className="chat_room_meta">
                  <span className="chat_room_time">{formatTime(room.lastTime)}</span>
                  {room.unread > 0 && <span className="chat_room_unread">{room.unread}</span>}
                  {room.archived && <span className="chat_room_archived">보관됨</span>}
                </div>
              </div>
            ))}
          </div>
          {/* 오른쪽: 채팅창 */}
          <div className="chat_main_box">
            {/* 채팅 헤더 */}
            {selectedRoom && (
            <div className="chat_main_head">
                <div className="flex gap_10 align_center">
                    <img src={selectedRoom.avatar} alt="방아바타" className="chat_main_avatar" />
                    <div>
                        <div className="chat_main_title">{selectedRoom.name}</div>
                        <div className="chat_main_members">{selectedRoom.members.join(", ")}</div>
                    </div>
                </div>
                <div className="flex gap_20">
                    <button className="chat_main_menu_btn" onClick={() => openMemberModal("edit")}>
                        멤버관리
                    </button>
                    <button className="chat_main_menu_btn" onClick={() => Archived()}>
                        {selectedRoom.archived == true ? <span>보관해제</span> : <span>보관</span>}
                    </button>
                </div>
            </div>
            )}
            {/* 채팅 검색 */}
            <form className="chat_search_row" onSubmit={handleSearch}>
              <input
                className="chat_search_input"
                placeholder="채팅 메시지 검색"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button className="chat_search_btn" type="submit">검색</button>
            </form>
            {/* 채팅 메시지 리스트 */}
            <div className="chat_main_messages" ref={dropZoneRef} style={{ minHeight: 300 }}>
              {selectedRoom && selectedRoom.messages.map(msg => (
                <div
                key={msg.id}
                className={`chat_msg_row${msg.me ? " right" : " left"}${searchResultIds.includes(msg.id) ? " search_highlight" : ""}`}
                ref={el => { msgRefs.current[msg.id] = el; if (searchResultIds.includes(msg.id)) chatEndRef.current = el; }}
                >
                  {!msg.me && (
                    <img src={selectedRoom.avatar} className="chat_msg_avatar" alt="상대" />
                  )}
                  <div className={`chat_msg_sender${msg.me ? " right" : " left"}`}>{msg.from}</div>
                  <div className={`chat_bubble${msg.me ? " right" : " left"}`}>
                    {msg.text && <span>{msg.text}</span>}
                    {/* 파일 첨부 */}
                    {msg.files && msg.files.length > 0 && (
                      <div className="chat_bubble_files">
                        {msg.files.map(file => (
                          <div key={file.id} className="chat_file_item">
                            <span className="chat_file_name">{file.name}</span>
                            <a
                              className="chat_file_download_btn"
                              href={`${apiUrl}/chat/file/download/${encodeURIComponent(file.saveName)}`}
                              download={file.name}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              다운로드
                            </a>
                            <span className="chat_file_expire">({file.expireAt}까지)</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="chat_meta">
                      <span className="chat_msg_time">{formatTime(msg.time)}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            {/* 파일만 업로드 */}
            <div className="chat_fileonly_row">
              <label className="chat_fileonly_label">
                파일만 업로드
                <input
                  type="file"
                  style={{ display: "none" }}
                  onChange={handleFileInputChange}
                  accept="*"
                />
              </label>
            </div>
            {/* 입력창 */}
            <form className="chat_input_row" onSubmit={handleSend}>
              <input
                className="chat_input"
                placeholder="메시지를 입력하세요..."
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              <label className="chat_file_label flex">
                <img src="/folder.png" alt="폴더" />
                <input
                  type="file"
                  style={{ display: "none" }}
                  onChange={handleFileInputChange}
                  accept="*"
                />
              </label>
              <button className="chat_send_btn" type="submit">전송</button>
            </form>
            {/* 파일 미리보기 */}
            {fileInput && (
              <div className="chat_file_preview">
                <span>{fileInput.name}</span>
                <button className="chat_file_cancel_btn" onClick={() => setFileInput(null)}>×</button>
              </div>
            )}
            {/* 채팅방 파일 리스트 */}
            {selectedRoom && (
            <div className="chat_filelist_box">
              <div className="chat_filelist_head">채팅방 파일함</div>
              {selectedRoom.files.length === 0 ? (
                <div className="chat_filelist_empty">등록된 파일이 없습니다.</div>
              ) : (
                selectedRoom.files.map(file => (
                  <div key={file.id} className="chat_filelist_row">
                    <span className="chat_filelist_name">{file.name}</span>
                    <span className="chat_filelist_expire">({file.expireAt}까지)</span>
                    <a
                      className="chat_filelist_download"
                      href={`${apiUrl}/chat/file/download/${encodeURIComponent(file.saveName)}`}
                      download={file.name}
                      target="_blank"
                      rel="noopener noreferrer"
                    >다운로드</a>
                  </div>
                ))
              )}
            </div>
            )}
          </div>
        </div>
      </div>
      {/* 채팅방 생성 모달 */}
      {createModal && (
        <div className="modal_overlay" onClick={() => setCreateModal(false)}>
          <div className="modal_content" onClick={e => e.stopPropagation()}>
            <h3 className="card_title font_700 mb_20">채팅방 생성</h3>
            <form className="flex flex_column gap_10" onSubmit={handleCreateRoom}>
              <div className="board_write_row">
                <label className="board_write_label">채팅방 이름</label>
                <input
                  type="text"
                  className="board_write_input"
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)}
                  required
                />
              </div>
              <div className="board_write_row">
                <label className="board_write_label">멤버 선택</label>
                <div className="member_checkbox_group" style={{display:"flex", flexWrap:"wrap", gap:8}}>
                  {newRoomMembers.map(user_id => {
                    const m = memberList.find(m => m.user_id === user_id);
                    return m ? (
                      <span key={user_id} style={{ background: "#e2f0ff", borderRadius: 4, padding: "2px 8px", marginRight: 4 }}>
                        {m.name} ({m.user_id})
                      </span>
                    ) : null;
                  })}
                  <button type="button" className="board_btn" style={{marginLeft:8}} onClick={() => openMemberModal("create")}>
                    + 멤버초대
                  </button>
                </div>
              </div>
              <div className="modal_buttons">
                <button type="submit" className="board_btn">생성</button>
                <button type="button" className="board_btn board_btn_cancel" onClick={() => setCreateModal(false)}>취소</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 멤버 초대/관리 모달 */}
      {memberModalOpen && (
        <div className="modal_overlay" style={{
          position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.35)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div className="modal_content" style={{
            background: "#fff", borderRadius: "12px", padding: "32px 24px", minWidth: 420, maxHeight: "70vh", overflowY: "auto"
          }}>
            <div className="modal_header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="font_700" style={{ fontSize: "1.2rem" }}>
                {memberModalMode === "edit" ? "채팅방 멤버 관리" : "참석자 선택"}
              </div>
              <button onClick={closeMemberModal} style={{ fontSize: "1.3rem", background: "none", border: "none", cursor: "pointer" }}>×</button>
            </div>
            <div className="modal_body" style={{ marginTop: 16 }}>
              <input
                type="text"
                value={searchKeyword}
                onChange={handleSearchMember}
                placeholder="이름, 아이디, 이메일 검색"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd", marginBottom: 14 }}
              />
              <div style={{ maxHeight: 240, overflowY: "auto", border: "1px solid #eee", borderRadius: 6 }}>
                {filteredMembers.length === 0 && (
                  <div style={{ padding: "16px", color: "#888" }}>검색 결과가 없습니다.</div>
                )}
                {filteredMembers.map(member => (
                  <div
                    key={member.user_id}
                    onClick={() => handleSelectMember(member.user_id)}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      background: selectedMembers.includes(member.user_id) ? "#e2f0ff" : "#fff",
                      borderBottom: "1px solid #f0f0f0"
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{member.name}</span>
                    <span style={{ color: "#888", marginLeft: 8 }}>{member.user_id}</span>
                    <span style={{ color: "#bbb", marginLeft: 8 }}>{member.email}</span>
                    {selectedMembers.includes(member.user_id) && (
                      <span style={{marginLeft:"20px"}}>✔</span>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 18, textAlign: "right" }}>
                <button
                  className="board_btn"
                  onClick={handleMemberConfirm}
                  type="button"
                >
                  선택완료
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <AlertModal />
      <Footer />
    </div>
  );
}
