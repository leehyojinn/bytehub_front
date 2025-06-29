'use client';

import Footer from "@/app/Footer";
import Header from "@/app/Header";
import React, { useState } from "react";

const teams = [
  { id: 1, name: "프론트엔드" },
  { id: 2, name: "백엔드" },
  { id: 3, name: "디자인팀" },
];

const folderPermissions = [
  { id: 1, team_id: 1, name: "프론트엔드 파일함", permission: "읽기,쓰기,공유" },
  { id: 2, team_id: 2, name: "백엔드 파일함", permission: "읽기,쓰기" },
  { id: 3, team_id: null, name: "공용 파일함", permission: "읽기,공유" }, // 전체 사원
];

const initialFiles = [
  { id: 1, folder_id: 1, name: "FE_기획서.pdf", uploader: "김부장", size: 1024 * 1024, uploadDate: "2025-06-25", expireDate: "2025-07-10", url: "#", teamOnly: true },
  { id: 2, folder_id: 3, name: "공용_디자인.png", uploader: "박팀장", size: 2 * 1024 * 1024, uploadDate: "2025-06-26", expireDate: "2025-07-30", url: "#", teamOnly: false }
];

const initialLinks = [
  { id: 1, folder_id: 1, title: "Figma 디자인", url: "https://figma.com", expireDate: "2025-07-15" }
];

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return bytes + " B";
}

export default function FileSystem() {
  // 선택 폴더
  const [selectedFolderId, setSelectedFolderId] = useState(folderPermissions[0].id);
  // 파일/링크 리스트
  const [files, setFiles] = useState(initialFiles);
  const [links, setLinks] = useState(initialLinks);

  // 업로드 폼
  const [upload, setUpload] = useState({ file: null, expireDate: "" });
  // 외부 링크 폼
  const [link, setLink] = useState({ title: "", url: "", expireDate: "" });

  // 권한 파싱
  const folder = folderPermissions.find(f => f.id === selectedFolderId);
  const canWrite = folder.permission.includes("쓰기");
  const canShare = folder.permission.includes("공유");

  // 파일 업로드
  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      alert("5MB 이하 파일만 업로드할 수 있습니다.");
      return;
    }
    setUpload({ ...upload, file });
  };
  const handleUpload = e => {
    e.preventDefault();
    if (!upload.file || !upload.expireDate) return;
    setFiles([
      ...files,
      {
        id: Date.now(),
        folder_id: selectedFolderId,
        name: upload.file.name,
        uploader: "나", // 실제 서비스는 로그인유저
        size: upload.file.size,
        uploadDate: new Date().toISOString().slice(0, 10),
        expireDate: upload.expireDate,
        url: "#",
        teamOnly: folder.team_id !== null
      }
    ]);
    setUpload({ file: null, expireDate: "" });
  };

  // 파일 삭제
  const handleDelete = id => {
    setFiles(files.filter(f => f.id !== id));
  };

  // 외부 링크 추가
  const handleLinkAdd = e => {
    e.preventDefault();
    if (!link.title || !link.url || !link.expireDate) return;
    setLinks([
      ...links,
      {
        id: Date.now(),
        folder_id: selectedFolderId,
        title: link.title,
        url: link.url,
        expireDate: link.expireDate
      }
    ]);
    setLink({ title: "", url: "", expireDate: "" });
  };

  // 외부 링크 삭제
  const handleLinkDelete = id => {
    setLinks(links.filter(l => l.id !== id));
  };

  // 현재 폴더 파일/링크만 표시
  const folderFiles = files.filter(f => f.folder_id === selectedFolderId);
  const folderLinks = links.filter(l => l.folder_id === selectedFolderId);

  return (
    <div>
        <Header/>
        <div className="wrap" style={{ padding: "60px 0", maxWidth: 900, margin: "0 auto" }}>
        <h2 className="card_title font_700 mb_30">팀별 파일함</h2>
        {/* 폴더/팀 선택 */}
        <div className="fs_folder_select_row">
            <label className="fs_label">폴더 선택</label>
            <select className="fs_input flex_1" value={selectedFolderId} onChange={e => setSelectedFolderId(Number(e.target.value))}>
            {folderPermissions.map(f => (
                <option key={f.id} value={f.id}>
                {f.name} ({f.permission}) {f.team_id ? `- ${teams.find(t => t.id === f.team_id)?.name}` : "(전체)"}
                </option>
            ))}
            </select>
            <span className="fs_permission_badge">{folder.permission}</span>
        </div>
        {/* 파일 업로드 */}
        <form className="fs_upload_form" onSubmit={handleUpload}>
            <div className="fs_upload_row">
            <label htmlFor="file-upload" className="board_file_label">
                파일 선택
            </label>
             <input
                className="upload-name flex_1"
                value={upload.file ? upload.file.name : "첨부파일을 선택하세요"}
                placeholder="첨부파일"
                readOnly
                tabIndex={-1}
            />
            <input
                type="file"
                id="file-upload"
                style={{ display: "none" }}
                onChange={handleFileChange}
                disabled={!canWrite}
                accept="*"
            />
            <input
                className="fs_input flex_1"
                type="date"
                value={upload.expireDate}
                onChange={e => setUpload({ ...upload, expireDate: e.target.value })}
                disabled={!canWrite}
                style={{ width: 140 }}
                placeholder="만료일"
            />
            <button type="submit" className="fs_btn" disabled={!canWrite || !upload.file || !upload.expireDate}>
                업로드
            </button>
            </div>
            {!canWrite && <div className="fs_warn">쓰기 권한이 없습니다.</div>}
        </form>
        {/* 파일 리스트 */}
        <div className="fs_filelist_box">
            <div className="fs_filelist_head">
            <span>파일명</span>
            <span>업로더</span>
            <span>크기</span>
            <span>업로드일</span>
            <span>만료일</span>
            <span>다운로드</span>
            <span>삭제</span>
            </div>
            {folderFiles.length === 0 ? (
            <div className="fs_filelist_empty">등록된 파일이 없습니다.</div>
            ) : (
            folderFiles.map(file => (
                <div className="fs_filelist_row" key={file.id}>
                <span>{file.name}</span>
                <span>{file.uploader}</span>
                <span>{formatSize(file.size)}</span>
                <span>{file.uploadDate}</span>
                <span>{file.expireDate}</span>
                <span className="fs_download_btn">
                    <a href={file.url} download >다운로드</a>
                </span>
                <span>
                    {canWrite ? (
                    <button className="fs_delete_btn" onClick={() => handleDelete(file.id)}>삭제</button>
                    ) : (
                    <span style={{ color: "#bbb" }}>-</span>
                    )}
                </span>
                </div>
            ))
            )}
        </div>
        {/* 외부 링크 공유 */}
        <div className="fs_link_section">
            <div className="fs_link_head">외부 링크 공유 {canShare ? "" : <span className="fs_warn">(공유권한 없음)</span>}</div>
            <div className="fs_link_list">
            {folderLinks.length === 0 ? (
                <div className="fs_filelist_empty">등록된 외부 링크가 없습니다.</div>
            ) : (
                folderLinks.map(link => (
                <div className="fs_link_row" key={link.id}>
                    <span className="fs_link_title">{link.title}</span>
                    <a className="fs_link_url" href={link.url} target="_blank" rel="noopener noreferrer">바로가기</a>
                    <span className="fs_link_expire">{link.expireDate}</span>
                    {canShare ? (
                    <button className="fs_delete_btn" onClick={() => handleLinkDelete(link.id)}>삭제</button>
                    ) : (
                    <span style={{ color: "#bbb" }}>-</span>
                    )}
                </div>
                ))
            )}
            </div>
            {/* 링크 추가 */}
            <form className="fs_link_add_form" onSubmit={handleLinkAdd} style={{ marginTop: 10 }}>
            <input
                className="fs_input"
                type="text"
                placeholder="링크명"
                value={link.title}
                onChange={e => setLink({ ...link, title: e.target.value })}
                disabled={!canShare}
                style={{ width: 120, marginRight: 8 }}
            />
            <input
                className="fs_input"
                type="url"
                placeholder="https://"
                value={link.url}
                onChange={e => setLink({ ...link, url: e.target.value })}
                disabled={!canShare}
                style={{ width: 210, marginRight: 8 }}
            />
            <input
                className="fs_input"
                type="date"
                value={link.expireDate}
                onChange={e => setLink({ ...link, expireDate: e.target.value })}
                disabled={!canShare}
                style={{ width: 140, marginRight: 8 }}
            />
            <button type="submit" className="fs_btn" disabled={!canShare || !link.title || !link.url || !link.expireDate}>추가</button>
            </form>
        </div>
        </div>
        <Footer/>
    </div>
  );
}
