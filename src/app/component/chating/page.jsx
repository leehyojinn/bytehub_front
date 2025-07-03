'use client';

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import React, { useState, useRef, useEffect } from "react";
import AlertModal from "../alertmodal/page";
import { useAlertModalStore } from "@/app/zustand/store";

const allMembers = [
  { id: "hong", name: "홍길동" },
  { id: "kim", name: "김철수" },
  { id: "lee", name: "이영희" },
  { id: "park", name: "박민수" },
];

const currentUser = "홍길동";

const chatRoomsInit = [
  {
    id: 1,
    name: "개발팀 단체방",
    avatar: "/profile.png",
    lastMsg: "오늘 회의자료 공유드려요!",
    lastTime: "2025-07-01 14:12",
    unread: 2,
    archived: false,
    lastActive: "2025-07-01 14:12",
    members: ["홍길동", "김철수", "이영희"],
    messages: [
      { id: 1, from: "홍길동", text: "오늘 회의자료 공유드려요!", time: "2025-07-01 14:12", me: true, files: [] },
      { id: 2, from: "김철수", text: "확인했습니다!", time: "2025-07-01 14:13", me: false, files: [] },
      { id: 3, from: "이영희", text: "감사합니다!", time: "2025-07-01 14:14", me: false, files: [] },
    ],
    files: [
      { id: 1, name: "회의자료.pdf", url: "/dummy.pdf", size: 1024 * 1024, uploadedAt: "2025-07-01 14:12", expireAt: "2025-07-08" }
    ]
  },
  {
    id: 2,
    name: "디자인팀",
    avatar: "/profile.png",
    lastMsg: "시안 수정본 확인 부탁드려요.",
    lastTime: "2025-07-01 11:30",
    unread: 0,
    archived: false,
    lastActive: "2025-07-01 11:30",
    members: ["홍길동", "박민수"],
    messages: [
      { id: 1, from: "박민수", text: "시안 수정본 확인 부탁드려요.", time: "2025-07-01 11:30", me: false, files: [] },
      { id: 2, from: "홍길동", text: "네 바로 확인할게요!", time: "2025-07-01 11:32", me: true, files: [] },
    ],
    files: []
  },
];

function formatTime(str) {
  if (!str) return "";
  const d = new Date(str.replace(/-/g, '/'));
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function ChatPage() {
  const [rooms, setRooms] = useState(chatRoomsInit);
  const [selectedRoomId, setSelectedRoomId] = useState(chatRoomsInit[0].id);
  const [input, setInput] = useState("");
  const [fileInput, setFileInput] = useState(null);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [editMembersModal, setEditMembersModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomMembers, setNewRoomMembers] = useState([currentUser]);
  const [editMembers, setEditMembers] = useState([]);
  const [searchResultIds, setSearchResultIds] = useState([]);
  const msgRefs = useRef({});
  const alertModal = useAlertModalStore();
  const chatEndRef = useRef(null);

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedRoomId, selectedRoom?.messages.length]);

  useEffect(() => {
    if (searchResultIds.length > 0) {
      // 첫 번째 결과로 스크롤
      const firstId = searchResultIds[0];
      if (msgRefs.current[firstId]) {
        msgRefs.current[firstId].scrollIntoView({ behavior: "smooth", block: "center" });
      }
      // 2초 후 하이라이트 해제
      const timer = setTimeout(() => setSearchResultIds([]), 2000);
      return () => clearTimeout(timer);
    }
  }, [searchResultIds]);

  const isOldRoom = (room) => {
    const last = new Date(room.lastActive.replace(/-/g, '/'));
    const now = new Date();
    const diff = (now - last) / (1000 * 60 * 60 * 24);
    return diff > 10;
  };

  // 메시지 전송 (텍스트/파일)
  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() && !fileInput) return;
    if (fileInput && fileInput.size > 5 * 1024 * 1024) {
      alertModal.openModal({ svg: "❗", msg1: "파일 용량 초과", msg2: "5MB 이하 파일만 업로드 가능합니다.", showCancel: false });
      return;
    }
    const now = new Date();
    const msgId = Date.now();
    const fileObj = fileInput
      ? [{
          id: msgId,
          name: fileInput.name,
          url: URL.createObjectURL(fileInput),
          size: fileInput.size,
          uploadedAt: now.toISOString().slice(0, 16).replace("T", " "),
          expireAt: formatTime(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16).replace("T", " "))
        }]
      : [];
    setRooms(prev =>
      prev.map(r =>
        r.id === selectedRoomId
          ? {
              ...r,
              messages: [
                ...r.messages,
                {
                  id: msgId,
                  from: currentUser,
                  text: input,
                  time: now.toISOString().slice(0, 16).replace("T", " "),
                  me: true,
                  files: fileObj
                }
              ],
              files: fileObj.length > 0 ? [...r.files, ...fileObj] : r.files,
              lastMsg: input || (fileObj[0]?.name ? `파일: ${fileObj[0].name}` : ""),
              lastTime: now.toISOString().slice(0, 16).replace("T", " "),
              lastActive: now.toISOString().slice(0, 16).replace("T", " "),
              unread: 0
            }
          : r
      )
    );
    setInput("");
    setFileInput(null);
  };

  // 파일만 업로드
  const handleFileOnlyUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alertModal.openModal({ svg: "❗", msg1: "파일 용량 초과", msg2: "5MB 이하 파일만 업로드 가능합니다.", showCancel: false });
      return;
    }
    const now = new Date();
    const msgId = Date.now();
    const fileObj = {
      id: msgId,
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      uploadedAt: now.toISOString().slice(0, 16).replace("T", " "),
      expireAt: formatTime(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16).replace("T", " "))
    };
    setRooms(prev =>
      prev.map(r =>
        r.id === selectedRoomId
          ? {
              ...r,
              messages: [
                ...r.messages,
                {
                  id: msgId,
                  from: currentUser,
                  text: "",
                  time: now.toISOString().slice(0, 16).replace("T", " "),
                  me: true,
                  files: [fileObj]
                }
              ],
              files: [...r.files, fileObj],
              lastMsg: `파일: ${file.name}`,
              lastTime: now.toISOString().slice(0, 16).replace("T", " "),
              lastActive: now.toISOString().slice(0, 16).replace("T", " "),
              unread: 0
            }
          : r
      )
    );
  };

  // 채팅방 아카이브
  const handleArchiveRoom = (roomId) => {
    setRooms(prev =>
      prev.map(r =>
        r.id === roomId ? { ...r, archived: true } : r
      )
    );
    alertModal.openModal({ svg: "📦", msg1: "채팅방 보관", msg2: "채팅방이 보관 처리되었습니다.", showCancel: false });
  };

  // 채팅 검색
  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    const matches = selectedRoom.messages
      .filter(m => m.text && m.text.includes(search))
      .map(m => m.id);
    if (matches.length > 0) {
      setSearchResultIds(matches);
    } else {
      alertModal.openModal({ svg: "🔍", msg1: "검색 결과 없음", msg2: "일치하는 메시지가 없습니다.", showCancel: false });
    }
  };

  // 파일 다운로드 안내
  const handleDownload = (file) => {
    alertModal.openModal({
      svg: "⬇️",
      msg1: "파일 다운로드",
      msg2: `파일명: ${file.name}\n만료일: ${file.expireAt}`,
      showCancel: false,
      onConfirm: () => window.open(file.url, "_blank")
    });
  };

  // 채팅방 생성
  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!newRoomName.trim() || newRoomMembers.length === 0) {
      alertModal.openModal({ svg: "❗", msg1: "입력 오류", msg2: "채팅방 이름과 멤버를 입력하세요.", showCancel: false });
      return;
    }
    const newId = Date.now();
    setRooms(prev => [
      ...prev,
      {
        id: newId,
        name: newRoomName,
        avatar: "/profile.png",
        lastMsg: "",
        lastTime: "",
        unread: 0,
        archived: false,
        lastActive: "",
        members: newRoomMembers,
        messages: [],
        files: []
      }
    ]);
    setSelectedRoomId(newId);
    setCreateModal(false);
    setNewRoomName("");
    setNewRoomMembers([currentUser]);
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

  // 보관된 채널도 리스트에 항상 노출
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
                    <button className="chat_main_menu_btn" onClick={() => handleArchiveRoom(selectedRoom.id)}>
                        보관
                    </button>
                </div>
            </div>
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
            <div className="chat_main_messages">
              {oldRoomNotice}
              {selectedRoom.messages.map(msg => (
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
                              onClick={() => handleDownload(file)}
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
                      onClick={() => handleDownload(file)}
                      type="button"
                    >다운로드</button>
                  </div>
                ))
              )}
            </div>
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
                <div className="member_checkbox_group">
                  {allMembers.map(m => (
                    <label key={m.id} className="member_checkbox_label">
                      <input
                        type="checkbox"
                        checked={newRoomMembers.includes(m.name)}
                        onChange={() => {
                          setNewRoomMembers(prev =>
                            prev.includes(m.name)
                              ? prev.filter(n => n !== m.name)
                              : [...prev, m.name]
                          );
                        }}
                      />
                      {m.name}
                    </label>
                  ))}
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
      {/* 멤버 추가/수정 모달 */}
      {editMembersModal && (
        <div className="modal_overlay" onClick={() => setEditMembersModal(false)}>
          <div className="modal_content" onClick={e => e.stopPropagation()}>
            <h3 className="card_title font_700 mb_20">채팅방 멤버 관리</h3>
            <form className="flex flex_column gap_10" onSubmit={handleEditMembers}>
              <div className="board_write_row">
                <label className="board_write_label">멤버 선택</label>
                <div className="member_checkbox_group">
                  {allMembers.map(m => (
                    <label key={m.id} className="member_checkbox_label">
                      <input
                        type="checkbox"
                        checked={
                          editMembers.length > 0
                            ? editMembers.includes(m.name)
                            : selectedRoom.members.includes(m.name)
                        }
                        onChange={() => {
                          setEditMembers(prev => {
                            const base = prev.length > 0 ? prev : selectedRoom.members;
                            return base.includes(m.name)
                              ? base.filter(n => n !== m.name)
                              : [...base, m.name];
                          });
                        }}
                      />
                      {m.name}
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
