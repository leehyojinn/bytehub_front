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
    return payload.id || "";  // Payload에 id가 있으면 반환
  } catch {
    return "";
  }
}

export default function BoardWrite() {
  console.log("=== BoardWrite 컴포넌트 로드됨 ===");
  
  // 게시글 제목/내용 form 상태
  const [form, setForm] = useState({
    subject: "",
    content: "",
  });

  // 첨부 이미지 상태
  const [imageFiles, setImageFiles] = useState([]);        
  const [previewUrls, setPreviewUrls] = useState([]);
  const [userId, setUserId] = useState("");

  // 상단 고정 여부
  const [checked, setChecked] = useState(false);
  const [pinnedCnt, setPinnedCnt] = useState(0);

  const pinChange = (e) => {
    setChecked(e.target.checked);
  }

  // API 서버 주소
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // 토큰에서 userId 추출하여 설정
  useEffect(() => {
    setUserId(getUserIdFromToken());
    // 상단 고정 개수 조회
    axios.get(`${apiUrl}/post/pinnedCnt`)
        .then(res => setPinnedCnt(res.data))
        .catch(() => setPinnedCnt(0));
  }, []); // 빈 dependency array 추가하여 한 번만 실행

  // 제목/내용 입력 변경 시 상태 업데이트
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 이미지 파일 선택 시 상태 및 미리보기 설정
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    console.log("파일 선택됨:", files);
    console.log("파일 개수:", files.length);
    if (files.length > 0) {
      console.log("첫 번째 파일:", files[0].name, files[0].size);
    }
    setImageFiles(files);

    // 미리보기용
    const readers = files.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        })
    );
    Promise.all(readers).then((results) => {
      console.log("미리보기 URL 생성됨:", results.length);
      setPreviewUrls(results);
      // 상태 업데이트 후 재확인
      setTimeout(() => {
        console.log("상태 업데이트 후 imageFiles 길이:", imageFiles.length);
      }, 100);
    });
  };

  // 폼 제출(게시글 등록) 처리 함수
  const handleSubmit = async (e) => {
    e.preventDefault(); // 기본 submit 동작 막기
    console.log("checked:", checked, "pinnedCnt:", pinnedCnt);
    if (checked && pinnedCnt >= 3) {
      alert("상단 고정은 최대 3개까지만 가능합니다.");
      return;
    }
    const token = sessionStorage.getItem("token");
    if (!token) {
      alert("로그인 후 이용해 주세요.");
      return;
    }
    try {
      let file_idx = null;
      
      console.log("게시글 작성 시작 - 파일 개수:", imageFiles.length);
      console.log("현재 imageFiles 상태:", imageFiles);
      
      // 1단계: 파일이 있으면 먼저 업로드
      if (imageFiles.length > 0) {
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
      
      // 2단계: 게시글 작성 (항상 JSON)
      const response = await axios.post(
        `${apiUrl}/board/write`,
        { 
          subject: form.subject,
          content: form.content,
          pinned: checked,
          category: 'NOTICE',
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
      const data = response.data;
      if (data.success) {
        alert("글이 등록되었습니다!");
        window.location.href = "/component/board"; // 등록 후 게시판 페이지로 이동
      } else {
        alert("글 등록 실패: " + (data.message || "오류"));
      }
    } catch (err) {
      console.error("전체 에러:", err);
      console.error("에러 응답:", err.response?.data);
      alert("서버 오류: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div>
      <Header />  {/* 상단 헤더 */}
      <div className="wrap padding_60_0">
        <div className="board_card board_write_card">
          <div className="card_title font_700 text_center">게시글 작성</div>

          <form className="board_write_form" onSubmit={handleSubmit} autoComplete="off">
            {/* 제목 입력란 */}
            <div className="board_write_row">
              <label htmlFor="subject" className="board_write_label small_text font_600">제목</label>
              <input
                id="subject"
                name="subject"
                className="board_write_input"
                type="text"
                placeholder="제목을 입력하세요"
                value={form.subject}
                onChange={handleChange}
                required
              />
            </div>

            {/* 여기에 상단 고정 여부 넣고 싶은뎅 */}
            <label className="my_checkbox_label">
              <input
                type="checkbox"
                name="myfilter"
                className="my_checkbox_input"
                checked={checked}
                onChange={pinChange}
              />
              <span className="my_checkbox_box"></span>
              <span className="my_checkbox_text">상단 고정</span>
            </label>

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



            {/* 이미지 업로드 */}
            <div className="board_write_row">
              <label className="board_write_label small_text font_600">이미지 첨부</label>
              <label htmlFor="imageUpload" className="board_file_label">
                파일 선택
              </label>
              <input
                id="imageUpload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="board_write_file"
                style={{ display: "none" }}
              />

              {/* 파일명 리스트 */}
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

              {/* 미리보기 리스트 */}
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

            {/* 등록/취소 버튼 */}
            <div className="board_write_footer">
              <button type="submit" className="board_btn board_write_btn">등록</button>
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
      <Footer />
    </div>
  );
}
