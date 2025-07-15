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
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState(initialLinks);
  const [isLoading, setIsLoading] = useState(false);
  
  // 페이징 관련 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // 페이지당 파일 수

  // 업로드 폼
  const [upload, setUpload] = useState({ files: [] });
  // 외부 링크 폼
  const [link, setLink] = useState({ title: "", url: "", expireDate: "" });

  // 권한 파싱
  const folder = folderPermissions.find(f => f.id === selectedFolderId);
  const canWrite = folder.permission.includes("쓰기");
  const canShare = folder.permission.includes("공유");

    // 파일 목록 가져오기
  const fetchFiles = async (deptIdx) => {
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
      console.log('파일 목록 요청 URL:', `${apiUrl}/cloud/list?deptIdx=${deptIdx}`);
      const response = await fetch(`${apiUrl}/cloud/list?deptIdx=${deptIdx}`);
      
      console.log('응답 상태:', response.status);
      if (response.ok) {
          const result = await response.json();
                      console.log('백엔드 응답:', result);
            console.log('파일 목록 데이터:', result.data);
            if (result.success) {
            const fileList = result.data.map((file, index) => {
              console.log('개별 파일 데이터:', file);
              return {
                id: file.file_idx || file.id || `temp-${Date.now()}-${index}`,
                folder_id: file.dept_idx || file.deptIdx || selectedFolderId,
                name: file.filename || file.name || '알 수 없는 파일',
                originalName: file.original_filename || file.originalName || file.filename || file.name || '알 수 없는 파일',
                uploader: file.uploader_name || file.user_id || file.uploader || '알 수 없음',
                user_id: file.user_id || '',
                dept_name: file.dept_name || '',
                size: file.size || file.file_size || 0,
                uploadDate: file.created_at ? new Date(file.created_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
                expireDate: file.expire_date || file.expireDate || '',
                url: "#",
                teamOnly: folder.team_id !== null
              };
            });
            console.log('변환된 파일 목록:', fileList);
            setFiles(fileList);
          } else {
            console.error('파일 목록 조회 실패:', result.message);
            setFiles([]);
          }
              } else {
          console.error('파일 목록 조회 실패:', response.status);
          const errorText = await response.text();
          console.error('에러 응답:', errorText);
          setFiles([]);
        }
      } catch (error) {
        console.error('파일 목록 조회 오류:', error);
        setFiles([]);
      } finally {
        setIsLoading(false);
      }
  };

  // 컴포넌트 마운트 시 파일 목록 가져오기
  React.useEffect(() => {
    fetchFiles(selectedFolderId);
    setCurrentPage(1); // 폴더 변경 시 페이지를 1로 리셋
  }, [selectedFolderId]);

  // 파일 업로드
  const handleFileChange = e => {
    const selectedFiles = Array.from(e.target.files);
    const oversizedFiles = selectedFiles.filter(file => file.size > 10 * 1024 * 1024);
    const validFiles = selectedFiles.filter(file => file.size <= 10 * 1024 * 1024);
    
    // 10MB 초과 파일이 있으면 한 번에 알림
    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(file => file.name).join(', ');
      alert(`다음 파일들은 10MB를 초과하여 제외됩니다:\n${fileNames}`);
    }
    
    setUpload({ ...upload, files: [...upload.files, ...validFiles] });
  };

  // 선택된 파일 삭제
  const handleRemoveFile = (index) => {
    const newFiles = upload.files.filter((_, i) => i !== index);
    setUpload({ ...upload, files: newFiles });
  };

  const handleUpload = async e => {
    e.preventDefault();
    if (upload.files.length === 0) return;

    try {
      // 실제 사용자 정보 가져오기
      const userId = sessionStorage.getItem('userId');
      if (!userId) {
        alert('로그인이 필요합니다.');
        return;
      }

      // 각 파일을 동시에 업로드
      const uploadResults = [];
      const failedFiles = [];

      for (const file of upload.files) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('deptIdx', selectedFolderId);
          formData.append('userId', userId);
          formData.append('expireDate', new Date().toISOString().slice(0, 10)); // 현재 날짜를 만료일로 설정

          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
          const response = await fetch(`${apiUrl}/cloud/upload`, {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            console.log(`파일 업로드 성공: ${file.name}`, result);
            
            const savedFile = result.data;
            uploadResults.push({
              id: savedFile?.file_idx || savedFile?.id || Date.now(),
              folder_id: Number(selectedFolderId),
              name: savedFile?.filename || savedFile?.name || file.name,
              originalName: file.name,
              uploader: userId,
              size: file.size,
              uploadDate: new Date().toISOString().slice(0, 10),
              expireDate: new Date().toISOString().slice(0, 10), // 현재 날짜로 설정
              url: "#",
              teamOnly: folder.team_id !== null
            });
          } else {
            const errorData = await response.json();
            console.error(`파일 업로드 실패: ${file.name}`, errorData);
            failedFiles.push(file.name);
          }
        } catch (error) {
          console.error(`파일 업로드 오류: ${file.name}`, error);
          failedFiles.push(file.name);
        }
      }
      
      // 성공한 파일들만 로컬 상태 업데이트
      if (uploadResults.length > 0) {
        setFiles(prevFiles => [...prevFiles, ...uploadResults]);
      }
      
      // 폼 초기화
      setUpload({ files: [] });
      
      // 파일 입력 필드 초기화
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';
      
      // 결과 메시지
      let message = '';
      if (uploadResults.length > 0) {
        message += `${uploadResults.length}개 파일 업로드 성공`;
      }
      if (failedFiles.length > 0) {
        message += `\n${failedFiles.length}개 파일 업로드 실패: ${failedFiles.join(', ')}`;
      }
      alert(message || '업로드 완료');
      
      // 파일 목록 새로고침
      fetchFiles(selectedFolderId);
    } catch (error) {
      console.error('업로드 오류:', error);
      alert('파일 업로드 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 파일 삭제
  const handleDelete = async (id) => {
    // 삭제 확인
    if (!confirm('정말로 이 파일을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
      const response = await fetch(`${apiUrl}/cloud/delete/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 로컬 상태에서도 삭제
          setFiles(files.filter(f => f.id !== id));
          alert('파일이 성공적으로 삭제되었습니다.');
        } else {
          alert('파일 삭제 실패: ' + (result.message || '알 수 없는 오류'));
        }
      } else {
        const errorData = await response.json();
        alert('파일 삭제 실패: ' + (errorData.message || '서버 오류'));
      }
    } catch (error) {
      console.error('파일 삭제 오류:', error);
      alert('파일 삭제 중 오류가 발생했습니다: ' + error.message);
    }
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

  // 30일이 지난 파일을 필터링하는 함수
  const isFileExpired = (uploadDate) => {
    if (!uploadDate) return false;
    const uploadTime = new Date(uploadDate).getTime();
    const currentTime = new Date().getTime();
    const thirtyOneDaysInMs = 30 * 24 * 60 * 60 * 1000; // 30일을 밀리초로
    return (currentTime - uploadTime) > thirtyOneDaysInMs;
  };

  // 파일의 만료일을 계산하는 함수
  const getFileExpireDate = (uploadDate) => {
    if (!uploadDate) return '';
    const uploadTime = new Date(uploadDate);
    const expireTime = new Date(uploadTime.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30일 후
    return expireTime.toISOString().slice(0, 10);
  };

  // 만료일까지 남은 일수를 계산하는 함수
  const getDaysUntilExpire = (uploadDate) => {
    if (!uploadDate) return null;
    const uploadTime = new Date(uploadDate);
    const expireTime = new Date(uploadTime.getTime() + (31 * 24 * 60 * 60 * 1000));
    const currentTime = new Date();
    const diffTime = expireTime.getTime() - currentTime.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // 현재 폴더 파일/링크만 표시 (숫자 타입으로 일관되게 처리)
  // 30일이 지난 파일은 제외
  const folderFiles = files
    .filter(f => Number(f.folder_id) === Number(selectedFolderId))
    .filter(f => !isFileExpired(f.uploadDate));
  const folderLinks = links.filter(l => Number(l.folder_id) === Number(selectedFolderId));

  // 페이징 관련 함수들
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 현재 페이지의 파일들만 표시
  const getCurrentPageFiles = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return folderFiles.slice(startIndex, endIndex);
  };

  // 전체 페이지 수 계산
  const totalPages = Math.ceil(folderFiles.length / pageSize);
  
  // 만료된 파일 수 계산
  const expiredFilesCount = files
    .filter(f => Number(f.folder_id) === Number(selectedFolderId))
    .filter(f => isFileExpired(f.uploadDate)).length;
  
  // 디버깅용 로그
  console.log('전체 파일 목록:', files);
  console.log('선택된 폴더 ID:', selectedFolderId);
  console.log('필터링된 파일 목록:', folderFiles);

  return (
    <div>
        <Header/>
        <div className="wrap" style={{ padding: "60px 0", maxWidth: 900, margin: "0 auto" }}>
        <h2 className="card_title font_700 mb_30">팀별 파일함</h2>
        {expiredFilesCount > 0 && (
          <div style={{
            padding: '8px 12px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            marginBottom: '20px',
            fontSize: '14px',
            color: '#856404'
          }}>
            ⚠️ {expiredFilesCount}개의 파일이 30일이 지나 자동으로 숨겨졌습니다.
          </div>
        )}
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
                value={upload.files.length > 0 ? `${upload.files.length}개 파일 선택됨` : "첨부파일을 선택하세요"}
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
                multiple
            />
            <button type="submit" className="fs_btn" disabled={!canWrite || upload.files.length === 0}>
                업로드
            </button>
            </div>
            
            {/* 선택된 파일 목록 */}
            {upload.files.length > 0 && (
                <div style={{ 
                    marginTop: '10px', 
                    padding: '10px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>선택된 파일:</div>
                    {upload.files.map((file, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '4px 8px',
                            marginBottom: '4px',
                            backgroundColor: 'white',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {file.name} ({formatSize(file.size)})
                            </span>
                            <button
                                type="button"
                                onClick={() => handleRemoveFile(index)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#dc3545',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    padding: '0 4px'
                                }}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            {!canWrite && <div className="fs_warn">쓰기 권한이 없습니다.</div>}
        </form>
        {/* 파일 리스트 */}
        <div className="fs_filelist_box" style={{ 
            display: 'flex', 
            flexDirection: 'column',
            border: '1px solid #ddd',
            borderRadius: '8px',
            overflow: 'hidden'
        }}>
            <div className="fs_filelist_head" style={{
                display: 'flex',
                padding: '12px 16px',
                backgroundColor: '#f8f9fa',
                borderBottom: '1px solid #ddd',
                fontWeight: 'bold',
                fontSize: '16.32px'
            }}>
            <span style={{ flex: 2, minWidth: 0 }}>파일명</span>
            <span style={{ flex: 1, textAlign: 'center' }}>업로더</span>
            <span style={{ flex: 1, textAlign: 'center' }}>크기</span>
            <span style={{ flex: 1, textAlign: 'center' }}>업로드일</span>
            <span style={{ flex: 1, textAlign: 'center' }}>만료일</span>
            <span style={{ flex: 1, textAlign: 'center' }}>다운로드</span>
            <span style={{ flex: 1, textAlign: 'center' }}>삭제</span>
            </div>
            {isLoading ? (
            <div className="fs_filelist_empty" style={{
                padding: '40px 16px',
                textAlign: 'center',
                color: '#666',
                fontSize: '16.32px'
            }}>파일 목록을 불러오는 중...</div>
            ) : folderFiles.length === 0 ? (
            <div className="fs_filelist_empty" style={{
                padding: '40px 16px',
                textAlign: 'center',
                color: '#666',
                fontSize: '16.32px'
            }}>등록된 파일이 없습니다.</div>
            ) : (
            getCurrentPageFiles().map((file, index) => (
                <div className="fs_filelist_row" key={`${file.id}-${index}`} style={{
                    display: 'flex',
                    padding: '12px 16px',
                    borderBottom: '1px solid #eee',
                    alignItems: 'center',
                    fontSize: '16.32px'
                }}>
                <span 
                    style={{ 
                        flex: 2, 
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}
                    title={file.originalName || file.name}
                >
                    {file.originalName || file.name}
                </span>
                <span style={{ flex: 1, textAlign: 'center' }}>{file.uploader}</span>
                <span style={{ flex: 1, textAlign: 'center' }}>{formatSize(file.size)}</span>
                <span style={{ flex: 1, textAlign: 'center' }}>{file.uploadDate}</span>
                <span style={{ flex: 1, textAlign: 'center' }}>
                  {(() => {
                    const expireDate = getFileExpireDate(file.uploadDate);
                    const daysLeft = getDaysUntilExpire(file.uploadDate);
                    
                    if (daysLeft === null) return '-';
                    if (daysLeft < 0) return <span style={{ color: '#dc3545', fontWeight: 'bold' }}>만료됨</span>;
                    if (daysLeft <= 7) return <span style={{ color: '#ffc107', fontWeight: 'bold' }}>{expireDate} ({daysLeft}일)</span>;
                    return <span style={{ color: '#28a745' }}>{expireDate}</span>;
                  })()}
                </span>
                <span className="fs_download_btn" style={{ flex: 1, textAlign: 'center' }}>
                    {(() => {
                        const daysLeft = getDaysUntilExpire(file.uploadDate);
                        const isExpired = daysLeft !== null && daysLeft < 0;
                        
                        if (isExpired) {
                            return (
                                <button 
                                    style={{
                                        color: '#6c757d',
                                        background: 'none',
                                        border: 'none',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '16.32px',
                                        cursor: 'not-allowed',
                                        textDecoration: 'line-through'
                                    }}
                                    disabled
                                    title="만료된 파일은 다운로드할 수 없습니다"
                                >
                                    다운로드
                                </button>
                            );
                        }
                        
                        return (
                            <button 
                                style={{
                                    color: '#007bff',
                                    background: 'none',
                                    border: 'none',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '16.32px',
                                    cursor: 'pointer'
                                }}
                                onClick={async (e) => {
                                    e.preventDefault();
                                    try {
                                        // 현재 사용자 ID 가져오기
                                        const userId = sessionStorage.getItem('userId');
                                        if (!userId) {
                                            alert('로그인이 필요합니다.');
                                            return;
                                        }

                                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
                                        const response = await fetch(`${apiUrl}/cloud/download/${file.id}?userId=${userId}`);
                                        
                                        if (response.ok) {
                                            // 파일 다운로드 처리
                                            const blob = await response.blob();
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = file.originalName || file.name;
                                            document.body.appendChild(a);
                                            a.click();
                                            window.URL.revokeObjectURL(url);
                                            document.body.removeChild(a);
                                        } else {
                                            alert('파일 다운로드에 실패했습니다.');
                                        }
                                    } catch (error) {
                                        console.error('다운로드 오류:', error);
                                        alert('파일 다운로드 중 오류가 발생했습니다.');
                                    }
                                }}
                            >
                                다운로드
                            </button>
                        );
                    })()}
                </span>
                <span style={{ flex: 1, textAlign: 'center' }}>
                    {canWrite ? (
                    <button 
                        className="fs_delete_btn" 
                        onClick={() => handleDelete(file.id)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc3545',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '16.32px',
                            textDecoration: 'underline'
                        }}
                        
                    >삭제</button>
                    ) : (
                    <span style={{ color: "#bbb" }}>-</span>
                    )}
                </span>
                </div>
            ))
            )}
        </div>
        
        <div className="board_pagination">
                    <button
                      className="board_btn"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      이전
                    </button>
                    {[...Array(totalPages)].map((_, idx) => (
                      <button
                        key={idx + 1}
                        className={`board_btn board_page_btn${currentPage === idx + 1 ? " active" : ""}`}
                        onClick={() => handlePageChange(idx + 1)}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    <button
                      className="board_btn"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      다음
                    </button>
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
