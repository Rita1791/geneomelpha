class GeneomelphaPortal {
  constructor() {
    this.currentService = null;
    this.bindEvents();
  }

  /* ======================
     EVENT BINDINGS
  ====================== */
  bindEvents() {
    document.querySelectorAll(".service-card").forEach(card => {
      card.addEventListener("click", () => {
        this.currentService = card.dataset.service;
        document.getElementById("serviceTitle").textContent =
          card.querySelector("h3").textContent;

        this.switchSection("analysisSection");
      });
    });

    document
      .getElementById("analysisForm")
      .addEventListener("submit", e => this.submitAnalysis(e));
  }

  /* ======================
     SECTION SWITCH
  ====================== */
  switchSection(id) {
    document.querySelectorAll(".section")
      .forEach(s => s.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
  }

  showServices() {
    this.switchSection("servicesSection");
  }

  /* ======================
     SUBMIT → BACKEND
  ====================== */
  submitAnalysis(e) {
    e.preventDefault();

    if (!this.currentService) {
      alert("Please select a genomic service first.");
      return;
    }

    const form = e.target;
    const formData = new FormData(form);

    // IMPORTANT: service name is not part of form inputs
    formData.append("service", this.currentService);

    // OPTIONAL: progress popup
    alert("Genomic analysis in progress…");

    fetch("http://localhost:5000/api/analyze", {
      method: "POST",
      body: formData
    })
      .then(res => {
        if (!res.ok) throw new Error("Backend error");
        return res.json();
      })
      .then(report => {
        this.renderReport(report);
        this.switchSection("reportViewer");
      })
      .catch(err => {
        console.error(err);
        alert("Analysis failed. Is backend running?");
      });
  }

  /* ======================
     RENDER REPORT
  ====================== */
  renderReport(r) {
    document.getElementById("rPatientId").textContent = r.patientId;
    document.getElementById("rLabId").textContent = r.labId;
    document.getElementById("rAge").textContent = r.age;
    document.getElementById("rGender").textContent = r.gender;
    document.getElementById("rService").textContent = r.service;
    document.getElementById("rSummary").textContent = r.summary;
    document.getElementById("rRecommendations").textContent = r.recommendations;

    const list = document.getElementById("rFindings");
    list.innerHTML = "";
    r.findings.forEach(f => {
      const li = document.createElement("li");
      li.textContent = f;
      list.appendChild(li);
    });

    // QR CODE
    const qrBox = document.getElementById("qrCanvas");
    qrBox.innerHTML = "";
    new QRCode(qrBox, {
      text: r.verificationHash,
      width: 90,
      height: 90
    });
  }

  /* ======================
     PDF DOWNLOAD
  ====================== */
  async downloadPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    const canvas = await html2canvas(
      document.getElementById("reportSummary"),
      { scale: 2 }
    );

    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      10,
      10,
      190,
      0
    );

    pdf.save("Geneomelpha_Clinical_Report.pdf");
  }
}

window.portal = new GeneomelphaPortal();
