'use client';

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import React, { useState, useRef, useEffect } from "react";
import AlertModal from "../alertmodal/page";
import { useAlertModalStore } from "@/app/zustand/store";
import { Client } from '@stomp/stompjs';
import SockJS from "sockjs-client";
import axios from "axios";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const wsUrl = process.env.NEXT_PUBLIC_WS_URL; // ex) "http://localhost:8080/ws-chat"

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
  const [editMembersModal, setEditMembersModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomMembers, setNewRoomMembers] = useState([getCurrentUser()]);
  const [editMembers, setEditMembers] = useState([]);
  const [searchResultIds, setSearchResultIds] = useState([]);
  const [memberList, setMemberList] = useState([]);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([getCurrentUser()]);
  const msgRefs = useRef({});
  const alertModal = useAlertModalStore();
  const chatEndRef = useRef(null);

  // WebSocket
  const stompClientRef = useRef(null);
  const subscriptionRef = useRef(null);
  const [connected, setConnected] = useState(false);

  // 멤버리스트 불러오기 (user_id, name, email)
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
      const res = await axios.get(`${apiUrl}/chat/rooms`);
      setRooms(res.data.map(room => ({
        ...room,
        id: room.chat_idx,
        name: room.chat_name,
        avatar: room.avatar,
        lastMsg: room.last_msg,
        lastTime: room.last_time,
        unread: room.unread ?? 0,
        archived: room.archived,
        lastActive: room.last_active,
        members: room.members, // user_id 배열
        messages: (room.messages || []).map(msg => ({
          id: msg.msg_idx,
          from: msg.user_id,
          text: msg.content,
          time: msg.reg_date,
          me: msg.user_id === getCurrentUser(),
          files: (msg.files || []).map(f => ({
            id: f.file_idx,
            name: f.name,
            url: f.url,
            size: f.size,
            uploadedAt: f.uploaded_at,
            expireAt: f.expire_at
          }))
        })),
        files: (room.files || []).map(f => ({
          id: f.file_idx,
          name: f.name,
          url: f.url,
          size: f.size,
          uploadedAt: f.uploaded_at,
          expireAt: f.expire_at
        }))
      })));
      if (res.data.length > 0) setSelectedRoomId(res.data[0].chat_idx);
    } catch (e) {
      setRooms([]);
    }
  }

  useEffect(() => {
    fetchMemberList();
    fetchRooms();
  }, []);

  // WebSocket 연결
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      debug: function (str) {
        // console.log(str);
      },
      onConnect: () => {
        setConnected(true);
      },
      onDisconnect: () => {
        setConnected(false);
      }
    });
    client.activate();
    stompClientRef.current = client;
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      client.deactivate();
    };
  }, []);

  // 채팅방 입장시 WebSocket 구독
  useEffect(() => {
    if (!connected || !selectedRoomId || !stompClientRef.current) return;
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }
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
                      url: f.url,
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
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
    // eslint-disable-next-line
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

  const isOldRoom = (room) => {
    const last = new Date(room?.lastActive?.replace(/-/g, '/'));
    const now = new Date();
    const diff = (now - last) / (1000 * 60 * 60 * 24);
    return diff > 10;
  };

  // 멤버 초대 모달 관련
  const openMemberModal = () => {
    setSelectedMembers([...newRoomMembers]);
    setSearchKeyword("");
    setMemberModalOpen(true);
  };
  const closeMemberModal = () => setMemberModalOpen(false);

  const handleSearchMember = (e) => {
    setSearchKeyword(e.target.value);
  };
  const handleSelectMember = (user_id) => {
    setSelectedMembers(prev =>
      prev.includes(user_id)
        ? prev.filter(n => n !== user_id)
        : [...prev, user_id]
    );
  };
  const handleMemberConfirm = () => {
    if (selectedMembers.length === 0) {
      alertModal.openModal({ svg: "❗", msg1: "멤버 선택", msg2: "최소 1명 이상 선택하세요.", showCancel: false });
      return;
    }
    setNewRoomMembers(selectedMembers);
    setMemberModalOpen(false);
  };

  const filteredMembers = memberList.filter(m =>
    (m.name && m.name.includes(searchKeyword)) ||
    (m.user_id && m.user_id.includes(searchKeyword)) ||
    (m.email && m.email.includes(searchKeyword))
  );

  // 메시지 전송 (텍스트/파일)
  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() && !fileInput) return;
    if (fileInput && fileInput.size > 5 * 1024 * 1024) {
      alertModal.openModal({ svg: "❗", msg1: "파일 용량 초과", msg2: "5MB 이하 파일만 업로드 가능합니다.", showCancel: false });
      return;
    }
    const now = new Date();
    if (stompClientRef.current && connected) {
      const msg = {
        chat_idx: selectedRoomId,
        user_id: getCurrentUser(),
        content: input,
        msg_type: fileInput ? "file" : "text",
        is_read: false,
        reg_date: now.toISOString().slice(0, 16).replace("T", " "),
        files: [] // 파일 첨부는 별도 처리 필요
      };
      stompClientRef.current.publish({
        destination: `/app/chat/${selectedRoomId}`,
        body: JSON.stringify(msg)
      });
    }
    setInput("");
    setFileInput(null);
  };

  // 파일만 업로드 (REST, 파일 메타만)
  const handleFileOnlyUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alertModal.openModal({ svg: "❗", msg1: "파일 용량 초과", msg2: "5MB 이하 파일만 업로드 가능합니다.", showCancel: false });
      return;
    }
    alertModal.openModal({ svg: "ℹ️", msg1: "파일 업로드", msg2: "실제 파일 업로드는 별도 구현 필요", showCancel: false });
  };

  // 채팅방 생성
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim() || newRoomMembers.length === 0) {
      alertModal.openModal({ svg: "❗", msg1: "입력 오류", msg2: "채팅방 이름과 멤버를 입력하세요.", showCancel: false });
      return;
    }
    try {
      // 서버에 채팅방 생성 요청
      const payload = {
        name: newRoomName,
        avatar: "/profile.png",
        members: newRoomMembers
      };
      const res = await axios.post(`${apiUrl}/chat/room`, payload);
      const chatIdx = res.data.id; // 서버가 반환한 chat_idx 사용

      // 방 목록 새로고침
      await fetchRooms();
      setSelectedRoomId(chatIdx); // 서버가 준 chat_idx로 선택
      setCreateModal(false);
      setNewRoomName("");
      setNewRoomMembers([getCurrentUser()]);
    } catch (error) {
      alertModal.openModal({ svg: "❗", msg1: "생성 오류", msg2: "채팅방 생성 중 오류가 발생했습니다.", showCancel: false });
    }
  };

  // 채팅방 멤버 추가/수정
  const handleEditMembers = (e) => {
    e.preventDefault();
    setRooms(prev =>
      prev.map(r =>
        r.id === selectedRoomId ? { ...r, members: editMembers } : r
      )
    );
    setEditMembersModal(false);
  };

  // 10일 미사용 채널 안내문구
  const oldRoomNotice = isOldRoom(selectedRoom)
    ? <div className="chat_oldroom_notice">이 채팅방은 10일 이상 사용하지 않아 자동 삭제 대상입니다.</div>
    : null;

  const visibleRooms = rooms;

  return (
    <div>
      <Header />
      <div className="wrap padding_60_0">
        <div className="chat_wrap">
          {/* 왼쪽: 채팅방 목록 */}
          <div className="chat_room_list">
            <div className="chat_room_list_head">
              <p className="chat_newroom_btn2" style={{cursor:"auto"}}>채팅방</p>
              <button className="chat_newroom_btn" onClick={() => setCreateModal(true)}>+ 새 채팅방</button>
              <button className="chat_archive_toggle" onClick={() => setShowArchived(v => !v)}>
                {showArchived ? "모든방" : "보관만"}
              </button>
            </div>
            {visibleRooms.length === 0 && (
              <div className="chat_room_none">채팅방이 없습니다.</div>
            )}
            {visibleRooms
              .filter(room => showArchived ? room.archived : true)
              .map(room => (
              <div
                key={room.id}
                className={`chat_room_item${selectedRoomId === room.id ? " active" : ""}${room.archived ? " archived" : ""}`}
                onClick={() => setSelectedRoomId(room.id)}
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
                    <button className="chat_main_menu_btn" onClick={() => setEditMembersModal(true)}>
                        멤버관리
                    </button>
                    <button className="chat_main_menu_btn" onClick={() => {/* 아카이브 처리 구현 */}}>
                        보관
                    </button>
                </div>
            </div>
            )}
            {/* 채팅 검색 */}
            <form className="chat_search_row" onSubmit={e => { e.preventDefault(); }}>
              <input
                className="chat_search_input"
                placeholder="채팅 메시지 검색"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button className="chat_search_btn" type="submit">검색</button>
            </form>
            {/* 채팅 메시지 리스트 */}
            <div className="chat_main_messages">
              {oldRoomNotice}
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
                            <button
                              className="chat_file_download_btn"
                              onClick={() => {/* 파일 다운로드 구현 */}}
                              type="button"
                            >
                              다운로드
                            </button>
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
                  onChange={handleFileOnlyUpload}
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
                  onChange={e => setFileInput(e.target.files[0])}
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
                    <button
                      className="chat_filelist_download"
                      onClick={() => {/* 파일 다운로드 구현 */}}
                      type="button"
                    >다운로드</button>
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
                  <button type="button" className="board_btn" style={{marginLeft:8}} onClick={openMemberModal}>
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
      {/* 멤버 초대 모달 */}
      {memberModalOpen && (
        <div className="modal_overlay" style={{
          position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.35)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div className="modal_content" style={{
            background: "#fff", borderRadius: "12px", padding: "32px 24px", minWidth: 420, maxHeight: "70vh", overflowY: "auto"
          }}>
            <div className="modal_header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="font_700" style={{ fontSize: "1.2rem" }}>참석자 선택</div>
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
      {/* 멤버 추가/수정 모달 */}
      {editMembersModal && (
        <div className="modal_overlay" onClick={() => setEditMembersModal(false)}>
          <div className="modal_content" onClick={e => e.stopPropagation()}>
            <h3 className="card_title font_700 mb_20">채팅방 멤버 관리</h3>
            <form className="flex flex_column gap_10" onSubmit={handleEditMembers}>
              <div className="board_write_row">
                <label className="board_write_label">멤버 선택</label>
                <div className="member_checkbox_group">
                  {memberList.map(m => (
                    <label key={m.user_id} className="member_checkbox_label">
                      <input
                        type="checkbox"
                        checked={
                          editMembers.length > 0
                            ? editMembers.includes(m.user_id)
                            : selectedRoom.members.includes(m.user_id)
                        }
                        onChange={() => {
                          setEditMembers(prev => {
                            const base = prev.length > 0 ? prev : selectedRoom.members;
                            return base.includes(m.user_id)
                              ? base.filter(n => n !== m.user_id)
                              : [...base, m.user_id];
                          });
                        }}
                      />
                      {m.name} ({m.user_id})
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal_buttons">
                <button type="submit" className="board_btn">저장</button>
                <button type="button" className="board_btn board_btn_cancel" onClick={() => setEditMembersModal(false)}>취소</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <AlertModal />
      <Footer />
    </div>
  );
}
