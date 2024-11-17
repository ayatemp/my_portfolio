document.addEventListener("DOMContentLoaded", () => {
    const title = document.querySelector(".artifact-title");

    // タイトルのフェードイン＆スライドアップ
    setTimeout(() => {
        title.classList.remove("hidden");
        title.classList.add("visible");
    }, 500);

    // フィルタ機能
    const filterButtons = document.querySelectorAll(".filter-btn");
    const artifacts = document.querySelectorAll(".artifact-card");

    filterButtons.forEach(button => {
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
});