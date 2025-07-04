'use client';

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import React, { useState, useEffect } from "react";
import axios from "axios";

function getUserIdFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return "";
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id || "";
  } catch {
    return "";
  }
}

export default function BoardWrite() {
  const [form, setForm] = useState({
    subject: "",
    content: "",
  });
  const [imageFiles, setImageFiles] = useState([]);        
  const [previewUrls, setPreviewUrls] = useState([]);
  const [userId, setUserId] = useState("");

  // 주소
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    setUserId(getUserIdFromToken());
  }, []);

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
          subject: form.subject,
          content: form.content,
          category: 'NOTICE',
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
        window.location.href = "/component/board";
      } else {
        alert("글 등록 실패: " + (data.message || "오류"));
      }
    } catch (err) {
      alert("서버 오류: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div>
      <Header />
      <div className="wrap padding_60_0">
        <div className="board_card board_write_card">
          <div className="card_title font_700 text_center">게시글 작성</div>
          <form className="board_write_form" onSubmit={handleSubmit} autoComplete="off">
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
