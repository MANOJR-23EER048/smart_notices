window.addEventListener('DOMContentLoaded', () => {
    const username = sessionStorage.getItem("loggedInUser");
    if (!username) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }
});

const form = document.getElementById('uploadForm');

form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = sessionStorage.getItem("loggedInUser");
    const notice = document.getElementById("noticeText").value.trim();
    const fileInput = document.getElementById("imageInput");
    const file = fileInput.files[0];

    if (!notice && !file) {
        alert("Please enter text or choose an image");
        return;
    }

    let imageBase64 = null;

    if (file) {
        // Convert file to Base64
        imageBase64 = await toBase64(file);
    }

    try {
        const res = await fetch("/upload_base64", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: username,
                text: notice,
                imageBase64: imageBase64
            })
        });

        const data = await res.json();

        if (res.ok) {
            alert("Upload successful!");
            window.location.href = "display.html";
        } else {
            alert(data.message || "Failed to upload notice");
        }
    } catch (err) {
        alert("Upload failed. Check connection.");
        console.error("Upload error:", err);
    }
});

// Helper function to convert file → Base64 string
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
}
