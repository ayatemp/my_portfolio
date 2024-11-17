document.addEventListener("DOMContentLoaded", () => {
    const title = document.querySelector(".artifact-title");

    // タイトルのフェードイン＆スライドアップ
    setTimeout(() => {
        title.classList.remove("hidden");
        title.classList.add("visible");
    }, 500);

    // 初期フィルタを「AI」に設定
    const filterButtons = document.querySelectorAll(".filter-btn");
    const artifacts = document.querySelectorAll(".artifact-card");
    
    const initialFilter = "ai"; // 初期フィルタを「AI」に設定
    filterButtons.forEach(button => {
        const filter = button.getAttribute("data-filter");
        
        if (filter === initialFilter) {
            button.classList.add("active"); // 「AI」ボタンにアクティブクラスを追加
        }

        button.addEventListener("click", () => {
            const filter = button.getAttribute("data-filter");

            artifacts.forEach(artifact => {
                if (filter === "all" || artifact.getAttribute("data-category") === filter) {
                    artifact.style.display = "block";
                } else {
                    artifact.style.display = "none";
                }
            });

            // 現在選択されているボタンにスタイルを適用
            filterButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");
        });
    });

    // 初期状態で「AI」フィルタを適用
    artifacts.forEach(artifact => {
        if (artifact.getAttribute("data-category") !== initialFilter) {
            artifact.style.display = "none";
        }
    });
});