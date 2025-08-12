fetch("/api/notice/latest")
  .then(res => {
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }
    return res.json();
  })
  .then(data => {
    const noticeTextEl = document.getElementById("noticeText");
    const noticeImageEl = document.getElementById("noticeImage");

    noticeTextEl.textContent = data?.text || "No notice text available.";

    if (data?.image) {
      noticeImageEl.src = data.image; // If Base64 from DB, it will render directly
      noticeImageEl.style.display = "block";
    } else {
      noticeImageEl.style.display = "none";
    }
  })
  .catch(err => {
    document.getElementById("noticeText").textContent = "Failed to load notice.";
    console.error("Error loading notice:", err);
  });
