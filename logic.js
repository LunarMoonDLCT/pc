const STORED_HASH = '43f308798286fa71fba949dcd79a86c1158ffcf1905a60e5bee667a7892ef782';
const SALT = '909218YIausid&@ja';
 
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hexHash;
}

document.addEventListener('DOMContentLoaded', () => {
    const lockScreen = document.getElementById('lock-screen');
    const loginBox = document.querySelector('.login-box');
    const timeEl = document.getElementById('time');
    const dateEl = document.getElementById('date');

    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        const day = now.getDate();
        const month = now.toLocaleString('vi-VN', { month: 'long' });
        const year = now.getFullYear();
        const dayOfWeek = now.toLocaleString('vi-VN', { weekday: 'long' });

        timeEl.textContent = `${hours}:${minutes}`;
        dateEl.textContent = `${dayOfWeek}, ${day} ${month}, ${year}`;
    }

    updateClock();
    setInterval(updateClock, 1000);

    lockScreen.addEventListener('click', () => {
        lockScreen.classList.add('lock-screen-fade-out');
        document.body.classList.add('zoomed-in');
        document.body.classList.add('dim-background'); // Kích hoạt làm tối nền
        loginBox.classList.remove('initially-hidden');
        realPasswordInput.focus();

        setTimeout(() => {
            lockScreen.style.display = 'none';
        }, 500);
    }, { once: true });

    const realPasswordInput = document.getElementById('password-input-real');
    const passwordDisplay = document.getElementById('password-display');
    const loginButton = document.getElementById('login-button');
    const errorMessage = document.getElementById('error-message');
    const passwordInputGroup = document.querySelector('.password-input-group');
    const togglePasswordButton = document.getElementById('toggle-password');

    function syncPasswordDisplay() {
        const password = realPasswordInput.value;
        const selectionStart = realPasswordInput.selectionStart;
        const hasFocus = document.activeElement === realPasswordInput;
        updatePasswordDisplay(password, selectionStart, hasFocus);
    }

    realPasswordInput.addEventListener('input', syncPasswordDisplay);
    realPasswordInput.addEventListener('focus', syncPasswordDisplay);
    realPasswordInput.addEventListener('blur', syncPasswordDisplay);
    realPasswordInput.addEventListener('keyup', syncPasswordDisplay);
    realPasswordInput.addEventListener('click', syncPasswordDisplay);

    function updatePasswordDisplay(password, caretPosition, hasFocus) {
        passwordDisplay.innerHTML = '';

        // Tạo các ký tự mật khẩu
        for (let i = 0; i < password.length; i++) {
            // Chèn con trỏ vào đúng vị trí
            if (hasFocus && i === caretPosition) {
                passwordDisplay.appendChild(createCaret());
            }
            const charSpan = document.createElement('span');
            charSpan.className = 'password-char';
            charSpan.textContent = password[i];
            passwordDisplay.appendChild(charSpan);
        }

        // Nếu con trỏ ở cuối chuỗi
        if (hasFocus && caretPosition === password.length) {
            passwordDisplay.appendChild(createCaret());
        }
    }

    function createCaret() {
        const caret = document.createElement('span');
        caret.className = 'fake-caret';
        return caret;
    }

    setTimeout(syncPasswordDisplay, 100);

    const handleLogin = async () => {
        const enteredPassword = realPasswordInput.value;

        errorMessage.textContent = '';

        if (enteredPassword.trim() === '') {
            errorMessage.textContent = 'Vui lòng nhập mật khẩu.';
            errorMessage.style.color = '#ffcc00';
            return;
        }
        const enteredPasswordHash = await sha256(enteredPassword + SALT);

        if (enteredPasswordHash === STORED_HASH) {
            const contentStage = document.querySelector('.login-content-stage');
            contentStage.classList.add('login-successful');

            setTimeout(() => {
                document.body.classList.remove('zoomed-in');
                document.body.classList.remove('dim-background'); // Làm sáng nền trở lại

                loginBox.classList.add('final-fade-out');

                setTimeout(() => {
                    const fileExplorer = document.getElementById('file-explorer');
                    fileExplorer.classList.remove('initially-hidden');
                }, 500);
            }, 2000);
        } else {
            errorMessage.textContent = 'Mật khẩu không đúng. Vui lòng thử lại.';
            errorMessage.style.color = '#ff4d4d';

            passwordInputGroup.classList.add('shake');
        }
    };

    loginButton.addEventListener('click', handleLogin);

    realPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });

    passwordInputGroup.addEventListener('animationend', () => {
        passwordInputGroup.classList.remove('shake');
    });

    let passwordAnimationTimeouts = [];
    let isPasswordVisible = false;

    function clearPasswordAnimations() {
        passwordAnimationTimeouts.forEach(clearTimeout);
        passwordAnimationTimeouts = [];
        passwordDisplay.querySelectorAll('.password-char').forEach(char => {
            char.classList.remove('glowing', 'sparkle', 'is-hiding', 'is-revealing');
        });
    }

    // Hàm để hiện mật khẩu với animation
    function showPassword() {
        if (isPasswordVisible) return;
        isPasswordVisible = true;
        clearPasswordAnimations();
        togglePasswordButton.classList.add('visible');
        const chars = passwordDisplay.querySelectorAll('.password-char');
        chars.forEach((char, index) => {
            const t1 = setTimeout(() => { // Domino effect
                char.classList.add('is-revealing');
                // Trì hoãn việc hiện ký tự để animation chạy trên dấu chấm trước
                const t_reveal = setTimeout(() => { char.classList.add('revealed'); }, 250);
                const t_cleanup = setTimeout(() => { char.classList.remove('is-revealing'); }, 250); // Dọn dẹp animation ngay khi ký tự hiện ra
                passwordAnimationTimeouts.push(t_reveal, t_cleanup);
            }, index * 50);
            passwordAnimationTimeouts.push(t1);
        });
    }

    // Hàm để ẩn mật khẩu với animation
    function hidePassword() {
        if (!isPasswordVisible) return;
        isPasswordVisible = false;
        clearPasswordAnimations();
        togglePasswordButton.classList.remove('visible');
        const chars = passwordDisplay.querySelectorAll('.password-char');
        chars.forEach((char, index) => {
            const t1 = setTimeout(() => {
                char.classList.add('is-hiding');
                char.classList.remove('revealed');
                const t2 = setTimeout(() => char.classList.remove('is-hiding'), 500);
                passwordAnimationTimeouts.push(t2);
            }, index * 50);
            passwordAnimationTimeouts.push(t1);
        });
    }

    let hidePasswordTimer = null;

    togglePasswordButton.addEventListener('mousedown', () => {
        showPassword();
        // Tự động ẩn sau một khoảng thời gian nếu người dùng tiếp tục giữ
        hidePasswordTimer = setTimeout(hidePassword, 3000); 
    });

    const releaseHandler = () => {
        clearTimeout(hidePasswordTimer); // Hủy tự động ẩn nếu người dùng nhả ra
        hidePassword();
    };

    togglePasswordButton.addEventListener('mouseup', releaseHandler);
    togglePasswordButton.addEventListener('mouseleave', releaseHandler);

    togglePasswordButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        showPassword();
    });
    togglePasswordButton.addEventListener('touchend', releaseHandler);

    const GITHUB_REPO_PATH = 'C:/Users/LunarMoonDLCT/Document';
    const GITHUB_REPO_OWNER = 'LunarMoonDLCT';
    const GITHUB_REPO_NAME = 'FileGame';
    const GITHUB_REPO_BRANCH = 'main'; // Hoặc 'master', tùy vào nhánh mặc định của bạn
    const GITHUB_RAW_URL = `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/${GITHUB_REPO_BRANCH}/`;
    
    let vfs = {
        'C:': {
            name: '(C:) LM-PC',
            type: 'drive',
            children: {
                'Users': {
                    name: 'Users',
                    type: 'folder',
                    children: {
                        'LunarMoonDLCT': {
                            name: 'LunarMoonDLCT',
                            type: 'folder',
                            children: {
                                'Document': {
                                    name: 'Document',
                                    type: 'folder',
                                    children: {}
                                }
                            }
                        }
                    }
                },
                'Program Files': {
                    name: 'Program Files',
                    type: 'folder',
                    children: {}
                },
                'Toàn folder': {
                    name: 'Toàn folder',
                    type: 'folder',
                    children: {}
                
                },
                'Windows': {
                    name: 'Windows',
                    type: 'folder',
                    children: {}
                }
            }
        }
    };
    let currentPath = 'C:';

    function getObjectByPath(path) {
        const parts = path.replace(/\\/g, '/').split('/').filter(p => p);
        if (parts.length === 0) return vfs;

        let current = vfs[parts[0]];
        if (!current) return null;

        for (let i = 1; i < parts.length; i++) {
            if (current.type === 'drive' || current.type === 'folder' || current.type === 'dir') {
                current = current.children[parts[i]];
                if (!current) return null;
            } else {
                return null;
            }
        }
        return current;
    }

    // Hàm này không còn cần thiết vì chúng ta sẽ tìm nạp toàn bộ cây tệp một lần
    // và xây dựng cấu trúc VFS từ đó.
    // Tuy nhiên, chúng ta sẽ giữ lại nó trong trường hợp cần dùng cho mục đích khác,
    // hoặc bạn có thể xóa nó đi.
    /*
    async function fetchRepoContents(path) {
        try {
            const response = await fetch(GITHUB_API_URL + path);
            if (!response.ok) {
                throw new Error(`Lỗi GitHub API: ${response.statusText}`);
            }
            const data = await response.json();
            data.sort((a, b) => {
                if (a.type === b.type) {
                    return a.name.localeCompare(b.name);
                }
                return a.type === 'dir' ? -1 : 1;
            });
            return data;
        } catch (error) {
            return null;
        }
    }
    */

    async function renderExplorer() {
        const drivesList = document.getElementById('drives-list');
        drivesList.innerHTML = '';
        Object.keys(vfs).forEach(driveId => {
            const drive = vfs[driveId];
            const isActive = currentPath.startsWith(driveId);
            drivesList.innerHTML += `
                <li data-path="${driveId}" class="${isActive ? 'active' : ''}">
                    <svg class="drive-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-5 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-4 8c0-1.54.62-2.92 1.62-3.91C11.73 12.42 13.26 12 15 12s3.27.42 4.38 1.09c1 .99 1.62 2.37 1.62 3.91v1H9v-1z"/></svg>
                    ${drive.name}
                </li>
            `;
        });

        const fileContainer = document.getElementById('file-container');
        fileContainer.innerHTML = '';
        document.getElementById('address-bar-input').value = currentPath;
        document.querySelector('.sidebar').style.display = 'block';
        
        const currentObject = getObjectByPath(currentPath);
        if (!currentObject || (currentObject.type !== 'drive' && currentObject.type !== 'folder' && currentObject.type !== 'dir')) {
            fileContainer.innerHTML = '<p style="color: #ffcc00;">Đường dẫn không hợp lệ.</p>';
            return;
        }

        const currentFolder = currentObject.children;
        if (Object.keys(currentFolder).length === 0 && currentPath !== 'C:') {
             fileContainer.innerHTML = '<p>Thư mục này trống.</p>';
        }

        const sortedItems = Object.entries(currentFolder).sort(([, a], [, b]) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return (a.type === 'folder' || a.type === 'dir') ? -1 : 1;
        });

        for (const [itemName, item] of sortedItems) {
            const itemTypeClass = (item.type === 'folder' || item.type === 'dir') ? 'folder' : 'file';
            const downloadUrlAttr = item.download_url ? `data-download-url="${item.download_url}"` : '';
            fileContainer.innerHTML += `
                <div class="fs-item" data-name="${itemName}" data-type="${item.type}" ${downloadUrlAttr}>
                    <div class="icon ${itemTypeClass}"></div>
                    <div class="name">${itemName}</div>
                </div>
            `;
        }

        document.getElementById('back-button').disabled = !currentPath.includes('/');
    }

    const contextMenu = document.getElementById('context-menu');
    const progressModal = document.getElementById('progress-modal');
    const progressBar = document.getElementById('progress-bar');
    const percentageText = document.getElementById('progress-percentage');
    const etaText = document.getElementById('progress-eta');
    const progressTitle = document.getElementById('progress-title');

    // Helper function to show the progress modal with an initial message
    function showInitialProgressModal(filename, initialMessage) {
        progressTitle.textContent = initialMessage;
        progressBar.style.width = '0%';
        percentageText.textContent = '0%';
        etaText.textContent = 'Thời gian ước tính: Đang tính toán...';
        progressModal.classList.remove('hidden');
    }
    let activeContextItem = null;

    async function downloadFile(url, filename) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Lỗi mạng: ${response.statusText}`);
            const blob = await response.blob();
            const objectUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = objectUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(objectUrl);
            document.body.removeChild(a);
        } catch (error) {
            alert(`Không thể tải tệp: ${filename}. Vui lòng kiểm tra console để biết chi tiết.`);
        }
    }

    // Đếm tệp trong một đối tượng VFS đã được cache
    function countFilesInVFS(vfsObject) {
        let count = 0;
        if (vfsObject.type === 'file') return 1;
        if (vfsObject.type === 'folder' || vfsObject.type === 'dir') {
            for (const childName in vfsObject.children) {
                count += countFilesInVFS(vfsObject.children[childName]);
            }
        }
        return count;
    }

    // Thêm thư mục từ VFS vào zip
    async function addFolderToZipFromVFS(zipFolder, vfsFolder, onProgress) {
        let filesAdded = 0;
        const children = Object.values(vfsFolder.children || {});

        await Promise.all(children.map(async (item) => {
            if (item.type === 'folder' || item.type === 'dir') {
                const subFolder = zipFolder.folder(item.name);
                const added = await addFolderToZipFromVFS(subFolder, item, onProgress);
                filesAdded += added;
            } else if (item.type === 'file') {
                try {
                    const response = await fetch(item.download_url); // download_url đã được thêm vào VFS
                    if (response.ok) {
                        const blob = await response.blob();
                        zipFolder.file(item.name, blob);
                        filesAdded++;
                        if (onProgress) onProgress();
                    }
                } catch (e) { console.error(`Không thể tải tệp: ${item.name}`, e); }
            }
        }));
        return filesAdded;
    }

    async function downloadFolderAsZip(folderPath, folderName) {
        const filename = `${folderName}.zip`;
        showInitialProgressModal(filename, `Đang chuẩn bị "${filename}"...`);
        try {
            const folderObject = getObjectByPath(folderPath);
            if (!folderObject) throw new Error("Thư mục không tồn tại trong VFS.");
            const totalFiles = countFilesInVFS(folderObject);
            let filesFetched = 0;

            const zip = new JSZip();
            const rootFolder = zip.folder(folderName);
            
            progressTitle.textContent = `Đang chuẩn bị 0/${totalFiles} tệp...`;
            await addFolderToZipFromVFS(rootFolder, folderObject, () => {
                filesFetched++;
                const percent = totalFiles > 0 ? ((filesFetched / totalFiles) * 100).toFixed(0) : 0;
                progressBar.style.width = `${percent}%`;
                percentageText.textContent = `${percent}%`;
                progressTitle.textContent = `Đang chuẩn bị ${filesFetched}/${totalFiles} tệp...`;
                etaText.textContent = `Đã tải ${filesFetched} trên ${totalFiles} tệp`;
            });

            await generateZipWithProgress(zip, filename);
        } catch (error) {
            console.error(`Lỗi khi tải thư mục ${folderName}:`, error);
            alert(`Không thể tạo tệp ZIP cho thư mục. Vui lòng kiểm tra console.`);
        } finally {
            progressModal.classList.add('hidden');
        }
    }

    async function generateZipWithProgress(zip, filename) {
        // This function now only updates the progress for the compression phase
        progressTitle.textContent = `Đang nén "${filename}"...`;

        let startTime = Date.now();

        try {
            const zipBlob = await zip.generateAsync({
                type: 'blob',
                compression: "DEFLATE",
                compressionOptions: {
                    level: 6
                }
            }, (metadata) => {
                const percent = metadata.percent.toFixed(0);
                progressBar.style.width = `${percent}%`;
                percentageText.textContent = `${percent}%`;

                if (percent > 0) {
                    const elapsedTime = (Date.now() - startTime) / 1000; // seconds
                    const totalTime = (elapsedTime / percent) * 100;
                    const remainingTime = totalTime - elapsedTime;
                    
                    if (remainingTime > 1) {
                        etaText.textContent = `Thời gian ước tính: ${Math.round(remainingTime)} giây`;
                    } else {
                        etaText.textContent = 'Sắp xong...';
                    }
                }
            });
            downloadFile(URL.createObjectURL(zipBlob), filename);
        } catch (error) {
            throw error; // Re-throw to be caught by the outer try-catch
        }
    }

    function showContextMenu(event) {
        event.preventDefault();
        activeContextItem = event.target.closest('.fs-item');
        if (!activeContextItem) return;

        contextMenu.classList.remove('hidden');
        
        const x = Math.min(event.clientX, window.innerWidth - contextMenu.offsetWidth - 10);
        const y = Math.min(event.clientY, window.innerHeight - contextMenu.offsetHeight - 10);

        contextMenu.style.top = `${y}px`;
        contextMenu.style.left = `${x}px`;
    }

    function hideContextMenu() {
        contextMenu.classList.add('hidden');
    }

    document.getElementById('file-container').addEventListener('contextmenu', (event) => {
        showContextMenu(event);
    });

    document.addEventListener('click', hideContextMenu);

    contextMenu.addEventListener('click', (event) => {
        if (!activeContextItem) return;
    
        const action = event.target.getAttribute('data-action');
    
        if (action === 'download') {
            const selectedItems = Array.from(fileContainer.querySelectorAll('.fs-item.selected'));
            const isRightClickedItemSelected = activeContextItem.classList.contains('selected');
    
            // Nếu có nhiều mục được chọn và mục được nhấp chuột phải nằm trong số đó
            if (selectedItems.length > 1 && isRightClickedItemSelected) {
                downloadMultipleItemsAsZip(selectedItems);
            } else {
                // Nếu chỉ có một mục được chọn (hoặc không có mục nào được chọn, chỉ có mục được nhấp chuột phải)
                const downloadUrl = activeContextItem.getAttribute('data-download-url');
                const itemName = activeContextItem.getAttribute('data-name');
                const itemType = activeContextItem.getAttribute('data-type');
    
                try {
                    if (itemType === 'file' && downloadUrl) {
                        downloadFile(downloadUrl, itemName);
                    } else if (itemType === 'dir' && currentPath.startsWith(GITHUB_REPO_PATH)) {                        
                        downloadFolderAsZip(`${currentPath}/${itemName}`.replace(/\\/g, '/'), itemName);
                    } else {
                        alert('Chức năng tải xuống không được hỗ trợ cho mục này.');
                    }
                } catch (error) {
                    console.error("Lỗi khi tải xuống:", error);
                    alert("Đã xảy ra lỗi trong quá trình tải xuống.");
                }
            }
        } else if (action === 'properties') {
            alert('Chức năng Properties đang được phát triển!');
        }
        hideContextMenu(); // Hide context menu after action
    });

    async function downloadMultipleItemsAsZip(itemsToZip) {
        const filename = 'download.zip';
        showInitialProgressModal(filename, `Đang chuẩn bị "${filename}"...`);

        try { 
            const zip = new JSZip();
            let totalFiles = 0;
            let filesFetched = 0;

            // Đếm tổng số tệp cần tải
            await Promise.all(itemsToZip.map(async (item) => {
                const itemName = item.getAttribute('data-name');
                const itemPath = `${currentPath}/${itemName}`.replace(/\\/g, '/');
                const vfsItem = getObjectByPath(itemPath);
                if (vfsItem) {
                    totalFiles += countFilesInVFS(vfsItem);
                } 
            }));

            const updateProgress = () => {
                filesFetched++;
                const percent = totalFiles > 0 ? ((filesFetched / totalFiles) * 100).toFixed(0) : 0;
                progressBar.style.width = `${percent}%`;
                percentageText.textContent = `${percent}%`;
                progressTitle.textContent = `Đang chuẩn bị ${filesFetched}/${totalFiles} tệp...`;
            };

            // Bắt đầu tải và thêm vào zip
            for (const item of itemsToZip) {
                const itemName = item.getAttribute('data-name');
                const itemType = item.getAttribute('data-type');
                const itemPath = `${currentPath}/${itemName}`.replace(/\\/g, '/');
                const vfsItem = getObjectByPath(itemPath);
                if (!vfsItem) continue;

                if ((itemType === 'file') && vfsItem.download_url) {
                    const response = await fetch(vfsItem.download_url);
                    if (response.ok) {
                        const blob = await response.blob();
                        zip.file(itemName, blob);
                        updateProgress();
                    }
                } else if (itemType === 'dir' || itemType === 'folder') {
                    await addFolderToZipFromVFS(zip.folder(itemName), vfsItem, updateProgress);
                }
            }

        await generateZipWithProgress(zip, filename);
        } catch (error) {
            console.error("Lỗi trong quá trình tải xuống nhiều mục:", error);
            alert(`Không thể tải xuống các mục đã chọn. Vui lòng kiểm tra console để biết chi tiết.`);
        } finally { progressModal.classList.add('hidden'); }
    }

    const fileExplorer = document.getElementById('file-explorer');
    const fileContainer = document.getElementById('file-container');
    const addressBarInput = document.getElementById('address-bar-input');
    const taskbar = document.getElementById('taskbar');
    const explorerTaskbarIcon = document.getElementById('taskbar-explorer-icon');

    let lastSelectedItem = null;

    fileContainer.addEventListener('click', (e) => {
        const targetItem = e.target.closest('.fs-item');

        // Bỏ chọn tất cả nếu nhấp vào nền
        if (!targetItem) {
            if (!e.ctrlKey && !e.shiftKey) {
                fileContainer.querySelectorAll('.fs-item.selected').forEach(item => {
                    item.classList.remove('selected');
                });
                lastSelectedItem = null;
            }
            return;
        }

        const allItems = Array.from(fileContainer.querySelectorAll('.fs-item'));

        if (e.ctrlKey) {
            // Ctrl + Click: Bật/tắt lựa chọn
            targetItem.classList.toggle('selected');
            lastSelectedItem = targetItem.classList.contains('selected') ? targetItem : null;
        } else if (e.shiftKey && lastSelectedItem) {
            // Shift + Click: Chọn một khoảng
            const lastIndex = allItems.indexOf(lastSelectedItem);
            const currentIndex = allItems.indexOf(targetItem);
            const start = Math.min(lastIndex, currentIndex);
            const end = Math.max(lastIndex, currentIndex);

            allItems.forEach((item, index) => {
                if (index >= start && index <= end) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                }
            });
        } else {
            // Click đơn: Chỉ chọn mục hiện tại
            allItems.forEach(item => item.classList.remove('selected'));
            targetItem.classList.add('selected');
            lastSelectedItem = targetItem;
        }
    });


    document.getElementById('file-container').addEventListener('dblclick', (event) => {
        const targetItem = event.target.closest('.fs-item');
        if (!targetItem) return;

        const itemName = targetItem.getAttribute('data-name');
        const itemType = targetItem.getAttribute('data-type');

        if (itemType === 'folder' || itemType === 'dir') {
            currentPath = `${currentPath}/${itemName}`;
            renderExplorer();
        } else if (itemType === 'file') {
            const downloadUrl = targetItem.getAttribute('data-download-url');
            if (downloadUrl) {
                downloadFile(downloadUrl, itemName);
            } else {
                alert(`Đang mở tệp cục bộ: ${itemName}\nChức năng xem trước nội dung đang được phát triển.`);
            }
        }
    });

    document.getElementById('drives-list').addEventListener('click', (event) => {
        const targetDrive = event.target.closest('li');
        if (targetDrive) {
            currentPath = targetDrive.getAttribute('data-path');
            renderExplorer();
        }
    });

    document.getElementById('back-button').addEventListener('click', () => {
        if (currentPath.includes('/')) {
            const parts = currentPath.split('/');
            parts.pop();
            currentPath = parts.join('/');
            if (!currentPath.includes('/')) {
                currentPath = currentPath;
            }
            renderExplorer();
        }
    });

    addressBarInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const newPath = addressBarInput.value;
            currentPath = newPath;
            renderExplorer();
        }
    });

    fileExplorer.querySelector('.close-btn').addEventListener('click', () => {
        fileExplorer.classList.add('final-fade-out');
        explorerTaskbarIcon.classList.add('hidden');
        taskbar.classList.add('hidden');

        setTimeout(() => fileExplorer.classList.add('hidden'), 500);
    });

    fileExplorer.querySelector('[aria-label="Maximize"]').addEventListener('click', () => {
        const isMaximized = fileExplorer.classList.contains('maximized');

        if (isMaximized) {
            // Restore from maximized state
            const previousState = JSON.parse(fileExplorer.dataset.previousState || '{}');
            fileExplorer.style.top = previousState.top || '50%';
            fileExplorer.style.left = previousState.left || '50%';
            fileExplorer.style.width = previousState.width || '80vw';
            fileExplorer.style.height = previousState.height || '80vh';
            if (previousState.left) { // Restoring to a dragged position
                fileExplorer.style.transform = 'none';
            } else { // Restoring to initial centered position
                 fileExplorer.style.transform = 'translate(-50%, -50%)';
            }
            fileExplorer.classList.remove('maximized');
        } else {
            // Maximize the window
            const rect = fileExplorer.getBoundingClientRect();
            fileExplorer.dataset.previousState = JSON.stringify({ top: `${rect.top}px`, left: `${rect.left}px`, width: `${rect.width}px`, height: `${rect.height}px` });
            fileExplorer.style.cssText = ''; // Clear all inline styles
            fileExplorer.classList.add('maximized');
        }
    });

    fileExplorer.querySelector('[aria-label="Minimize"]').addEventListener('click', () => {
        // Tạm thời xóa transform inline để animation thu nhỏ hoạt động
        fileExplorer.style.transform = ''; 
        fileExplorer.classList.add('initially-hidden');
        taskbar.classList.remove('hidden');
        explorerTaskbarIcon.classList.remove('hidden');
    });

    // Khôi phục cửa sổ từ taskbar
    explorerTaskbarIcon.addEventListener('click', () => {
        if (fileExplorer.style.top) fileExplorer.style.transform = 'none';
        fileExplorer.classList.remove('initially-hidden');
        explorerTaskbarIcon.classList.add('hidden');
        taskbar.classList.add('hidden');
    });

    const windowHeader = fileExplorer.querySelector('.window-header');
    let isDragging = false;
    let offsetX, offsetY;

    windowHeader.addEventListener('mousedown', (e) => {
        if (e.target.closest('.control-btn')) {
            return;
        }

        if (fileExplorer.classList.contains('maximized')) {
            return;
        }

        isDragging = true;
        
        // Lấy vị trí chính xác của cửa sổ tại thời điểm click
        const rect = fileExplorer.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        
        // Chuyển đổi từ định vị transform sang top/left để kéo mượt mà
        fileExplorer.style.left = `${rect.left}px`;
        fileExplorer.style.top = `${rect.top}px`;
        fileExplorer.style.transform = 'none'; // Xóa transform sau khi đã đặt top/left

        windowHeader.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            fileExplorer.style.left = `${e.clientX - offsetX}px`;
            fileExplorer.style.top = `${e.clientY - offsetY}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        if (windowHeader) { // Kiểm tra xem windowHeader có tồn tại không
            windowHeader.style.cursor = 'move';
        }
    });

    async function populateGithubVFS() {
        try {
            const apiUrl = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/git/trees/${GITHUB_REPO_BRANCH}?recursive=1`;
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`GitHub API error: ${response.statusText}`);
            const data = await response.json();

            if (!data.tree) throw new Error("Invalid response from GitHub Tree API");

            const githubRoot = getObjectByPath(GITHUB_REPO_PATH);
            if (!githubRoot) return;

            for (const item of data.tree) {
                const parts = item.path.split('/');
                let currentLevel = githubRoot;

                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    const isLastPart = i === parts.length - 1;

                    if (!currentLevel.children[part]) {
                        currentLevel.children[part] = {
                            name: part,
                            type: isLastPart ? (item.type === 'blob' ? 'file' : 'dir') : 'dir',
                            children: (isLastPart && item.type === 'blob') ? undefined : {}
                        };
                    }
                    if (isLastPart && item.type === 'blob') {
                        currentLevel.children[part].download_url = GITHUB_RAW_URL + item.path;
                    }
                    currentLevel = currentLevel.children[part];
                }
            }
        } catch (error) {
            console.error("Failed to populate GitHub VFS:", error);
            const githubRoot = getObjectByPath(GITHUB_REPO_PATH);
            if (githubRoot) {
                githubRoot.children['error.txt'] = { name: 'error.txt', type: 'file', content: `Failed to load content from GitHub: ${error.message}` };
            }
        }
    }

    function initializeApp() {
        populateGithubVFS().then(() => {
            renderExplorer();
        });
    }

    initializeApp(); 
});
