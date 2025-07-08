'use client';

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import React, { useState, useEffect } from "react";
import axios from "axios";

// JWT 토큰에서 사용자 ID를 추출하는 함수
function getUserIdFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return "토큰 없음";
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id || "";  // Payload에 id가 있으면 반환
  } catch {
    return "";
  }
}

export default function MeetingWrite() {
  const [form, setForm] = useState({
    title: "",
    author: "",
    content: "",
  });
  const [imageFiles, setImageFiles] = useState([]);      
  const [previewUrls, setPreviewUrls] = useState([]); 
  const [userId, setUserId] = useState("");

   // API 서버 주소
   const apiUrl = process.env.NEXT_PUBLIC_API_URL;

   // 토큰에서 userId 추출하여 설정
   useEffect(() => {
     setUserId(getUserIdFromToken());
   });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인 후 이용해 주세요.");
      return;
    }
    try {
      const response = await axios.post(
        `${apiUrl}/board/write`,
        {
          subject: form.title,
          content: form.content,
          category: 'MEETING',
          user_id: userId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": token, // JWT 토큰 인증 헤더
          },
        }
      );
      alert("글이 등록되었습니다!");
    } catch (error) {
      console.error("글 등록 중 오류 발생:", error);
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
