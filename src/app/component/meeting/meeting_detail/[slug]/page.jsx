'use client';

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import { meetingMinutes } from "../../page";
import Link from "next/link";

async function fakeAISummary(content) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve("이 회의록은 AI가 자동으로 요약한 예시입니다. 주요 안건, 결정사항, 다음 일정 등이 간결하게 정리됩니다.");
    }, 1400);
  });
}

const MIN_LENGTH = 50;
const MAX_LENGTH = 5000;

export default function MeetingDetail() {
  const params = useParams();
  const { slug } = params;

  const post = meetingMinutes.find(p => String(p.id) === String(slug));
  const idx = meetingMinutes.findIndex(p => String(p.id) === String(slug));
  const prevPost = meetingMinutes[idx - 1];
  const nextPost = meetingMinutes[idx + 1];

  const [summary, setSummary] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [editValue, setEditValue] = useState("");

  const contentText =
    typeof post.content === "string"
      ? post.content.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
      : "";

  const contentLength = contentText.length;

  const canSummarize =
    contentLength >= MIN_LENGTH && contentLength <= MAX_LENGTH;

  const handleAISummary = async () => {
    setLoading(true);
    setAiError("");
    setSummary("");
    setEditing(false);
    try {
      const result = await fakeAISummary(contentText);
      setSummary(result);
      setEditValue(result);
    } catch (e) {
      setAiError("AI 요약에 실패했습니다. 다시 시도해 주세요.");
    }
    setLoading(false);
  };

  const handleEdit = () => {
    setEditing(true);
    setEditValue(summary || "");
  };

  const handleEditSave = () => {
    setSummary(editValue);
    setEditing(false);
  };

  if (!post) {
    return (
      <div>
        <Header />
        <div className="wrap padding_60_0">
          <div className="board_card padding_40">
            <h2 className="card_title font_700">게시글을 찾을 수 없습니다.</h2>
            <div className="small_text mt_20">존재하지 않는 게시글이거나, 삭제된 게시글입니다.</div>
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
        <div className="board_card padding_40">
          <h2 className="card_title font_700">{post.title}</h2>
          <div className="flex gap_20 align_center mt_10 small_text detail_meta">
            <span>작성자: <b>{post.author}</b></span>
            <span>등록일: {post.date}</span>
            <span>조회수: {post.views}</span>
          </div>
          {/* 본문 */}
          <div className="su_small_text mt_30 text_left">
            <p>
              {post.content ||
                "이곳에 게시글 본문 내용이 들어갑니다. 실제 서비스에서는 줄바꿈, 이미지, 첨부파일 등 다양한 요소가 들어갈 수 있습니다."}
            </p>
            {/* 첨부파일 예시 */}
            {post.files && post.files.length > 0 && (
              <div className="mt_20">
                <span className="font_600 small_text">첨부파일:</span>
                <ul>
                  {post.files.map((file, idx) => (
                    <li key={idx}>
                      <a href={file.url} download="download" className="board_file_link">{file.name}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* AI 요약 버튼 및 결과 */}
          <div className="ai_summary_wrap mt_30">
            <div className="ai_summary_label font_600 mb_8">AI 요약</div>
            <div className="ai_summary_guide su_small_text mb_8">
              {`본문 글자 수: ${contentLength} / 최소 ${MIN_LENGTH}자, 최대 ${MAX_LENGTH}자`}
            </div>
            {!canSummarize && (
              <div className="ai_summary_error mb_10">
                {contentLength < MIN_LENGTH
                  ? `본문이 너무 짧아 요약할 수 없습니다. (${MIN_LENGTH}자 이상)`
                  : `본문이 너무 깁니다. (${MAX_LENGTH}자 이하)`}
              </div>
            )}
            <button
              className="ai_summary_btn"
              onClick={handleAISummary}
              disabled={!canSummarize || loading}
            >
              {loading ? "AI 요약 중..." : "AI로 요약하기"}
            </button>
            {aiError && (
              <div className="ai_summary_error mt_10">
                {aiError}
                <button
                  className="ai_summary_retry_btn"
                  onClick={handleAISummary}
                  disabled={loading}
                  style={{
                    marginLeft: 10,
                    fontSize: "1rem",
                    padding: "3px 14px",
                    borderRadius: "5px",
                    border: "none",
                    background: "var(--primary-color2)",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  재시도
                </button>
              </div>
            )}
            {(summary || editing) && (
              <div className="ai_summary_result mt_20">
                <div className="ai_summary_label font_600 mb_6">
                  {editing ? "직접 요약/수정" : "AI 요약 결과"}
                </div>
                {editing ? (
                  <div>
                    <textarea
                      className="ai_summary_textarea"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      rows={5}
                      maxLength={MAX_LENGTH}
                      style={{ width: "100%", fontSize: "1.08rem", padding: "10px", borderRadius: "7px", border: "1.5px solid var(--primary-color2)" }}
                    />
                    <div className="flex gap_10 mt_8">
                      <button className="ai_summary_btn" onClick={handleEditSave}>저장</button>
                      <button className="ai_summary_btn" style={{ background: "#eee", color: "#888" }} onClick={() => setEditing(false)}>취소</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="ai_summary_text">{summary}</div>
                    <button className="ai_summary_btn mt_10" onClick={handleEdit}>직접 요약/수정</button>
                  </div>
                )}
              </div>
            )}
            {/* AI 요약 결과가 없을 때 직접 입력 */}
            {!summary && !editing && canSummarize && !loading && (
              <div className="mt_20">
                <button className="ai_summary_btn" onClick={() => { setEditing(true); setEditValue(""); }}>
                  직접 요약 입력
                </button>
              </div>
            )}
          </div>

          {/* 이전/다음글 */}
          <div className="board_detail_nav mt_30 width_100 flex flex_column gap_10">
            {prevPost && (
              <div className="board_nav_item">
                <span className="board_nav_label su_small_text">이전글</span>
                <Link href={`/component/meeting/meeting_detail/${prevPost.id}`} className="board_nav_link small_text">
                  {prevPost.title}
                </Link>
              </div>
            )}
            {nextPost && (
              <div className="board_nav_item">
                <span className="board_nav_label su_small_text">다음글</span>
                <Link href={`/component/meeting/meeting_detail/${nextPost.id}`} className="board_nav_link small_text">
                  {nextPost.title}
                </Link>
              </div>
            )}
          </div>

          {/* 목록 버튼 */}
          <div className="width_100 mt_30 flex justify_end">
            <div className="board_btn">
              <Link href="/component/meeting">목록으로</Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
