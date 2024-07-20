function captureScreenshot() {
  html2canvas(document.body).then((canvas) => {
    let link = document.createElement("a");
    link.download = "screenshot.png";
    link.href = canvas.toDataURL();
    link.click();
  });
}
