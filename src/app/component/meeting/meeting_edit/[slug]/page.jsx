'use client'

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";

// JWT 토큰에서 사용자 ID를 추출하는 함수
function getUserIdFromToken() {
  const token = sessionStorage.getItem("token");
  if (!token) return "토큰 없음";
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id || "";
  } catch {
    return "";
  }
}

export default function MeetingEdit() {
  console.log("=== MeetingEdit 컴포넌트 로드됨 ===");
  
  const params = useParams();
  const { slug } = params;
  const router = useRouter();
  
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
  const [existingFile, setExistingFile] = useState(null); // 기존 파일 정보
  const [keepExistingFile, setKeepExistingFile] = useState(true); // 기존 파일 유지 여부
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // 기존 게시글 데이터 불러오기
  useEffect(() => {
    const fetchPostDetail = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem('token');

        const response = await axios.get(`${apiUrl}/post/detail/${slug}`, {
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          const postData = response.data;
          
          // 폼 데이터 설정
          setForm({
            title: postData.subject || '',
            author: postData.user_id || '',
            content: postData.content || '',
            attendees: postData.attendees ? postData.attendees.join(', ') : ''
          });

          // 참석자 정보는 폼에서만 설정 (selectedMembers는 모달에서 별도 관리)

          // 기존 파일 정보 설정
          if (postData.files && postData.files.length > 0) {
            setExistingFile(postData.files[0]);
          }

          console.log('기존 게시글 데이터:', postData);
        } else {
          alert('게시글을 불러올 수 없습니다.');
          router.push('/component/meeting');
        }
      } catch (err) {
        console.error('게시글 상세 조회 오류:', err);
        alert('게시글을 불러오는 중 오류가 발생했습니다.');
        router.push('/component/meeting');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPostDetail();
    }
  }, [slug, apiUrl, router]);

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

  // 폼 입력 변경
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 이미지 업로드
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    setKeepExistingFile(false); // 새 파일 선택 시 기존 파일 제거

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
    // 기존 참석자를 selectedMembers에 설정
    const currentAttendees = form.attendees
      ? form.attendees.split(",").map(s => s.trim()).filter(Boolean)
      : [];
    setSelectedMembers(currentAttendees);
  };

  // 참석자 모달 닫기
  const closeMemberModal = () => {
    setMemberModalOpen(false);
  };

  // 참석자 검색 (meeting_write와 동일한 로직)
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

  // 참석자 선택/해제 (meeting_write와 동일한 로직)
  const handleSelectMember = (user_id) => {
    if (selectedMembers.includes(user_id)) {
      setSelectedMembers(selectedMembers.filter(id => id !== user_id));
    } else {
      setSelectedMembers([...selectedMembers, user_id]);
    }
  };

  // 참석자 선택 완료 (meeting_write와 동일한 로직)
  const handleMemberConfirm = () => {
    setForm({
      ...form,
      attendees: selectedMembers.join(", ")
    });
    setMemberModalOpen(false);
  };

  // 기존 파일 제거
  const removeExistingFile = () => {
    setExistingFile(null);
    setKeepExistingFile(false);
  };

  // 게시글 수정 제출
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (!form.content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    try {
      const token = sessionStorage.getItem("token");
      const attendeesArr = form.attendees.split(',').map(name => name.trim()).filter(name => name);
      
      let file_idx = null;

      // 파일 처리
      if (keepExistingFile && existingFile) {
        // 기존 파일 유지
        file_idx = existingFile.file_idx;
        console.log("기존 파일 유지 - file_idx:", file_idx);
      } else if (imageFiles.length > 0) {
        // 새 파일 업로드
        const formData = new FormData();
        formData.append("file", imageFiles[0]);

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
          console.log("새 파일 업로드 성공, file_idx:", file_idx);
        } else {
          console.error("파일 업로드 실패:", fileResponse.data);
          alert("파일 업로드 실패: " + fileResponse.data.message);
          return;
        }
      }

      // 게시글 수정
      const response = await axios.put(
        `${apiUrl}/board/update`,
        {
          post_idx: parseInt(slug),
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

      if (response.data.success) {
        alert("회의록이 수정되었습니다!");
        router.push(`/component/meeting/meeting_detail/${slug}`);
      } else {
        alert("수정에 실패했습니다: " + (response.data.message || "알 수 없는 오류"));
      }
    } catch (error) {
      console.error("글 수정 중 오류 발생:", error);
      console.error("에러 응답:", error.response?.data);
      alert("글 수정 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="wrap padding_60_0">
          <div className="board_card padding_40">
            <div className="text_center">
              <div className="small_text">게시글을 불러오는 중...</div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="wrap padding_60_0">
        <div className="board_card board_write_card">
          <div className="card_title font_700 text_center">회의록 수정</div>
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

            {/* 내용 입력란 */}
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
              <label className="board_write_label small_text font_600">파일 첨부</label>
              
              {/* 기존 파일 표시 */}
              {existingFile && keepExistingFile && (
                <div className="existing_file_info" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '10px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  backgroundColor: '#f9f9f9',
                  marginBottom: '10px'
                }}>
                  <span>{existingFile.name}</span>
                  <button 
                    type="button" 
                    onClick={removeExistingFile}
                    style={{
                      marginLeft: '10px',
                      padding: '4px 8px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    제거
                  </button>
                </div>
              )}

              {/* 새 파일 업로드 */}
              {(!existingFile || !keepExistingFile) && (
                <>
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
                </>
              )}

              {/* 이미지 미리보기 */}
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

            {/* 수정/취소 버튼 */}
            <div className="board_write_footer">
              <button type="submit" className="board_btn board_write_btn">
                수정하기
              </button>
              <button
                type="button"
                className="board_btn board_write_btn board_btn_cancel"
                onClick={() => router.push(`/component/meeting/meeting_detail/${slug}`)}
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