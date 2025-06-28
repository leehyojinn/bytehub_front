'use client';

import Footer from "@/app/Footer";
import Header from "@/app/Header";
import Link from "next/link";
import React, { useState } from "react";

export const boardPosts = [
  { id: 1, title: "7월 워크샵 후기 공유합니다", author: "김철수", date: "2025-06-27", views: 41 },
  { id: 2, title: "점심 메뉴 추천받아요", author: "이영희", date: "2025-06-26", views: 35 },
  { id: 3, title: "신입사원 환영합니다!", author: "관리자", date: "2025-06-25", views: 59 },
  { id: 4, title: "업무 효율 꿀팁 공유", author: "박민수", date: "2025-06-24", views: 22 },
  { id: 5, title: "사내 동호회 모집", author: "최지연", date: "2025-06-23", views: 18 },
  { id: 6, title: "7월 생일자 명단", author: "관리자", date: "2025-06-22", views: 30 },
  { id: 7, title: "연차 사용 안내", author: "인사팀", date: "2025-06-21", views: 44 },
  { id: 8, title: "사내 보안 교육", author: "보안팀", date: "2025-06-20", views: 27 },
  { id: 9, title: "회의실 예약 방법", author: "관리자", date: "2025-06-19", views: 19 },
  { id: 10, title: "점심시간 변경 안내", author: "총무팀", date: "2025-06-18", views: 25 },
  { id: 11, title: "7월 워크샵 후기 공유합니다", author: "김철수", date: "2025-06-27", views: 41 },
  { id: 12, title: "점심 메뉴 추천받아요", author: "이영희", date: "2025-06-26", views: 35 },
  { id: 13, title: "신입사원 환영합니다!", author: "관리자", date: "2025-06-25", views: 59 },
  { id: 14, title: "업무 효율 꿀팁 공유", author: "박민수", date: "2025-06-24", views: 22 },
  { id: 15, title: "사내 동호회 모집", author: "최지연", date: "2025-06-23", views: 18 },
  { id: 16, title: "7월 생일자 명단", author: "관리자", date: "2025-06-22", views: 30 },
  { id: 17, title: "연차 사용 안내", author: "인사팀", date: "2025-06-21", views: 44 },
  { id: 18, title: "사내 보안 교육", author: "보안팀", date: "2025-06-20", views: 27 },
  { id: 19, title: "회의실 예약 방법", author: "관리자", date: "2025-06-19", views: 19 },
  { id: 20, title: "점심시간 변경 안내", author: "총무팀", date: "2025-06-18", views: 25 },
];

const POSTS_PER_PAGE = 15;

export default function Board() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // 검색 필터링
  const filteredPosts = boardPosts.filter(
    post =>
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.author.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);

  const startIdx = (page - 1) * POSTS_PER_PAGE;
  const endIdx = startIdx + POSTS_PER_PAGE;
  const currentPosts = filteredPosts.slice(startIdx, endIdx);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  // 검색어 입력 시 1페이지로 이동
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

   return (
    <div>
      <Header />
      <div className="wrap padding_60_0">
        <div className="board_card padding_60_0">
          <div className="card_title font_700 text_center">공지사항</div>
          <div className="board_search_wrap">
            <input
              className="board_search_input"
              type="text"
              placeholder="제목 또는 작성자 검색"
              value={search}
              onChange={handleSearchChange}
            />
            <button className="board_search_btn" tabIndex={-1}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <circle cx="9" cy="9" r="7" stroke="#433878" strokeWidth="2"/>
                <line x1="14.2" y1="14.2" x2="18" y2="18" stroke="#433878" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <table className="board_table">
            <thead>
              <tr>
                <th className="small_text">제목</th>
                <th className="small_text">작성자</th>
                <th className="small_text">등록일</th>
                <th className="small_text">조회수</th>
              </tr>
            </thead>
            <tbody>
              {currentPosts.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ color: "#aaa", padding: "32px 0" }}>검색 결과가 없습니다.</td>
                </tr>
              ) : (
                currentPosts.map((post) => (
                  <tr key={post.id}>
                    <td className="board_title">
                      <Link href={`/component/board/board_detail/${post.id}`}>
                        {post.title}
                      </Link>
                    </td>
                    <td>{post.author}</td>
                    <td>{post.date}</td>
                    <td>{post.views}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="board_pagination">
            <button
              className="board_btn"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              이전
            </button>
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx + 1}
                className={`board_btn board_page_btn${page === idx + 1 ? " active" : ""}`}
                onClick={() => handlePageChange(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
            <button
              className="board_btn"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
            >
              다음
            </button>
          </div>
          <div className="board_footer">
            <Link href="/component/board/board_write">
              <button className="board_btn">글쓰기</button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}