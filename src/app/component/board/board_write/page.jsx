'use client';

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import React, { useState } from "react";

export default function BoardWrite() {
  const [form, setForm] = useState({
    title: "",
    author: "",
    content: "",
  });
  const [imageFiles, setImageFiles] = useState([]);        
  const [previewUrls, setPreviewUrls] = useState([]);       

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

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("글이 등록되었습니다!");
  };

  return (
    <div>
      <Header />
      <div className="wrap padding_60_0">
        <div className="board_card board_write_card">
          <div className="card_title font_700 text_center">게시글 작성</div>
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
            <div className="board_write_row">
              <label htmlFor="author" className="board_write_label small_text font_600">작성자</label>
              <input
                id="author"
                name="author"
                className="board_write_input"
                type="text"
                placeholder="이름을 입력하세요"
                value={form.author}
                onChange={handleChange}
                required
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
