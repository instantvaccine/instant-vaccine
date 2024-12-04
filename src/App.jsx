import React, { useState } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const randomizeDoseDates = (startDate, endDate, minMonthsApart) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dates = [];

  while (true) {
    const randomDate = new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime())
    );

    if (
      dates.every(
        (d) =>
          Math.abs(
            (randomDate.getTime() - new Date(d).getTime()) /
              (1000 * 60 * 60 * 24 * 30)
          ) >= minMonthsApart &&
          Math.abs(
            (randomDate.getTime() - new Date(d).getTime()) /
              (1000 * 60 * 60 * 24 * 30)
          ) <= (minMonthsApart + 4)
      )
    ) {
      dates.push(randomDate.toISOString().split('T')[0]);
    }

    if (dates.length >= 2) break;
  }

  return dates.sort((a, b) => new Date(a) - new Date(b));
};

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00Z`);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

function VaccinationPDFGenerator() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthday, setBirthday] = useState('');

  const handleGeneratePDF = async () => {
    if (!firstName || !lastName || !birthday) {
      alert('Please enter your first name, last name, and birthday!');
      return;
    }

    const doses = randomizeDoseDates('2021-01-01', '2021-12-31', 2);

    const pdfUrl = import.meta.env.BASE_URL + 'VaccineHistory.pdf';
    const existingPdfBytes = await fetch(pdfUrl).then((res) => res.arrayBuffer());
  
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
  
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
    // Replace name
    firstPage.drawText(`${lastName.toUpperCase()}, ${firstName.toUpperCase()}`, {
      x: 130,
      y: height - 64,
      z: 100,
      size: 7,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Replace Date of Birth
    firstPage.drawText(`${formatDate(birthday)}`, {
      x: 130,
      y: height - 76,
      z: 100,
      size: 7,
      font: font,
      color: rgb(0, 0, 0),
    });
  
    // Replace Dose 1 Date
    firstPage.drawText(`Dose given on ${formatDate(doses[0])}`, {
      x: 26,
      y: height - 124,
      z: 100,
      size: 7,
      font: font,
      color: rgb(0, 0, 0),
    });
  
    // Replace Dose 2 Date
    firstPage.drawText(`Dose given on ${formatDate(doses[1])}`, {
      x: 26,
      y: height - 138,
      z: 100,
      size: 7,
      font: font,
      color: rgb(0, 0, 0),
    });
  
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
  
    const link = document.createElement('a');
    link.href = url;
    link.download = `${firstName.toUpperCase()}-${lastName.toUpperCase()}-Vaccine-History.pdf`;
    link.click();
  };

  return (
    <div style={{ fontFamily: 'Arial' }}>
      <h1>Get Vaccinated and a PDF</h1>
      <label>
        Enter your first name:
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          style={{ marginLeft: '10px' }}
        />
      </label>
      <br />
      <label>
        Enter your last name:
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          style={{ marginLeft: '10px', marginTop: '10px' }}
        />
      </label>
      <br />
      <label>
        Enter your birthday:
        <input
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          style={{ marginLeft: '10px', marginTop: '10px' }}
        />
      </label>
      <br />
      <button
        onClick={handleGeneratePDF}
        style={{
          marginTop: '20px',
          padding: '5px 10px',
          cursor: 'pointer',
        }}
      >
        Generate PDF
      </button>
    </div>
  );
}

export default VaccinationPDFGenerator;
