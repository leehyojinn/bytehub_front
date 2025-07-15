'use client';

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import React, { useState, useEffect } from "react";
import axios from "axios";

// JWT 토큰에서 사용자 ID를 추출하는 함수
function getUserIdFromToken() {
  const token = sessionStorage.getItem("token"); // sessionStorage로 통일
  if (!token) return "토큰 없음";
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id || "";
  } catch {
    return "";
  }
}

export default function MeetingWrite() {
  console.log("=== MeetingWrite 컴포넌트 로드됨 ===");
  
  const [form, setForm] = useState({
    title: "",
    author: "",
    content: "",
    attendees: "",
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [userId, setUserId] = useState("");
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [memberList, setMemberList] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // 멤버리스트 불러오기
  async function member_list() {
    const { data } = await axios.post(`${apiUrl}/member/list`);
    setMemberList(data.list || []);
    setFilteredMembers(data.list || []);
  }

  useEffect(() => {
    member_list();
  }, [apiUrl]);

  // 토큰에서 userId 추출하여 설정
  useEffect(() => {
    setUserId(getUserIdFromToken());
  }, []);

  // 참석자 인풋 변경
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 이미지 업로드
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);

    const readers = files.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        })
    );
    Promise.all(readers).then((results) => setPreviewUrls(results));
  };

  // 참석자 모달 오픈
  const openMemberModal = () => {
    setMemberModalOpen(true);
    setSearchKeyword("");
    setFilteredMembers(memberList);
    setSelectedMembers(
      form.attendees
        ? form.attendees.split(",").map(s => s.trim()).filter(Boolean)
        : []
    );
  };

  // 참석자 모달 닫기
  const closeMemberModal = () => {
    setMemberModalOpen(false);
  };

  // 참석자 검색
  const handleSearch = (e) => {
    const keyword = e.target.value;
    setSearchKeyword(keyword);
    if (!keyword) {
      setFilteredMembers(memberList);
    } else {
      setFilteredMembers(
        memberList.filter(
          m =>
            m.user_id.includes(keyword) ||
            (m.name && m.name.includes(keyword)) ||
            (m.email && m.email.includes(keyword))
        )
      );
    }
  };

  // 참석자 선택/해제
  const handleSelectMember = (user_id) => {
    if (selectedMembers.includes(user_id)) {
      setSelectedMembers(selectedMembers.filter(id => id !== user_id));
    } else {
      setSelectedMembers([...selectedMembers, user_id]);
    }
  };

  // 참석자 선택 완료
  const handleMemberConfirm = () => {
    setForm({
      ...form,
      attendees: selectedMembers.join(", ")
    });
    setMemberModalOpen(false);
  };

  // 글 등록
  const handleSubmit = async (e) => {
    console.log("=== handleSubmit 함수 호출됨 ===");
    e.preventDefault();
    const token = sessionStorage.getItem("token");
    if (!token) {
      alert("로그인 후 이용해 주세요.");
      return;
    }

    const attendeesArr = form.attendees
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    try {
      let file_idx = null;
      
      console.log("회의록 작성 시작 - 파일 개수:", imageFiles?.length || 0);
      
      // 1단계: 파일이 있으면 먼저 업로드
      if (imageFiles && imageFiles.length > 0) {
        console.log("파일 업로드 시작 - 첫 번째 파일:", imageFiles[0].name);
        const formData = new FormData();
        formData.append("file", imageFiles[0]); // 첫 번째 파일만 업로드
        
        const fileResponse = await axios.post(
          `${apiUrl}/board/file/upload`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              "Authorization": token,
            },
          }
        );
        
        if (fileResponse.data.success) {
          file_idx = fileResponse.data.file_idx;
          console.log("파일 업로드 성공, file_idx:", file_idx);
        } else {
          console.error("파일 업로드 실패:", fileResponse.data);
          alert("파일 업로드 실패: " + fileResponse.data.message);
          return;
        }
      } else {
        console.log("선택된 파일 없음 - file_idx는 null로 설정");
      }

      // 2단계: 회의록 작성 (항상 JSON)
      await axios.post(
        `${apiUrl}/board/write`,
        {
          attendees: attendeesArr,
          subject: form.title,
          content: form.content,
          category: 'MEETING',
          user_id: userId,
          file_idx: file_idx
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": token,
          },
        }
      );
      alert("글이 등록되었습니다!");
      window.location.href = "/component/meeting";
    } catch (error) {
      console.error("글 등록 중 오류 발생:", error);
      console.error("에러 응답:", error.response?.data);
      alert("글 등록 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div>
      <Header />
      <div className="wrap padding_60_0">
        <div className="board_card board_write_card">
          <div className="card_title font_700 text_center">회의록 작성</div>
          <form className="board_write_form" onSubmit={handleSubmit} autoComplete="off">
            <div className="board_write_row">
              <label htmlFor="title" className="board_write_label small_text font_600">제목</label>
              <input
                id="title"
                name="title"
                className="board_write_input"
                type="text"
                placeholder="제목을 입력하세요"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* 작성자 표시란 */}
            <div className="board_write_row">
              <label htmlFor="author" className="board_write_label small_text font_600">작성자</label>
              <input
                id="author"
                name="author"
                className="board_write_input"
                type="text"
                value={userId}
                readOnly
              />
            </div>

            {/* 참석자 인풋: 클릭 시 모달 오픈 */}
            <div className="board_write_row">
              <label htmlFor="attendees" className="board_write_label small_text font_600">참석자</label>
              <input
                type="text"
                name="attendees"
                className="board_write_input"
                value={form.attendees}
                placeholder="참가자 아이디를 콤마(,)로 구분해 입력하세요"
                readOnly
                onClick={openMemberModal}
                style={{ background: "#f9f9f9", cursor: "pointer" }}
              />
            </div>

            <div className="board_write_row">
              <label htmlFor="content" className="board_write_label small_text font_600">내용</label>
              <textarea
                id="content"
                name="content"
                className="board_write_textarea"
                placeholder="내용을 입력하세요"
                value={form.content}
                onChange={handleChange}
                rows={7}
                required
              />
            </div>
            <div className="board_write_row">
              <label className="board_write_label small_text font_600">이미지 첨부</label>
              <label htmlFor="imageUpload" className="board_file_label">
                파일 선택
              </label>
              <input
                id="imageUpload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="board_write_file"
                style={{ display: "none" }}
              />
              {imageFiles.length > 0 && (
                <div className="board_file_name">
                  {imageFiles.map((file, idx) => (
                    <span key={idx}>
                      {file.name}
                      {idx < imageFiles.length - 1 && ", "}
                    </span>
                  ))}
                </div>
              )}
              {previewUrls.length > 0 && (
                <div className="board_write_preview_multi">
                  {previewUrls.map((url, idx) => (
                    <div className="board_write_preview" key={idx}>
                      <img src={url} alt={`미리보기${idx + 1}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="board_write_footer">
              <button 
                type="submit" 
                className="board_btn board_write_btn"
                onClick={() => console.log("=== 등록 버튼 클릭됨 ===")}
              >
                등록
              </button>
              <button
                type="button"
                className="board_btn board_write_btn board_btn_cancel"
                onClick={() => window.history.back()}
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 참석자 선택 모달 */}
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
                onChange={handleSearch}
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
      <Footer />
    </div>
  );
}
