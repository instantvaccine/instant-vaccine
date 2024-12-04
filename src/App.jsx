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
  const [errors, setErrors] = useState({});

  // Add validation functions
  const validateName = (name) => {
    return /^[A-Za-z]+$/.test(name);
  };

  const validateBirthday = (date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const minAge = 4; // Updated minimum age requirement
    const maxAge = 120; // Maximum reasonable age
    
    return age >= minAge && age <= maxAge;
  };

  // Update handlers with validation
  const handleFirstNameChange = (e) => {
    const value = e.target.value;
    setFirstName(value);
    if (!validateName(value)) {
      setErrors(prev => ({ ...prev, firstName: 'Please use letters only' }));
    } else {
      setErrors(prev => ({ ...prev, firstName: null }));
    }
  };

  const handleLastNameChange = (e) => {
    const value = e.target.value;
    setLastName(value);
    if (!validateName(value)) {
      setErrors(prev => ({ ...prev, lastName: 'Please use letters only' }));
    } else {
      setErrors(prev => ({ ...prev, lastName: null }));
    }
  };

  const handleBirthdayChange = (e) => {
    const value = e.target.value;
    setBirthday(value);
    if (!validateBirthday(value)) {
      setErrors(prev => ({ ...prev, birthday: 'Age must be between 4 and 120 years' }));
    } else {
      setErrors(prev => ({ ...prev, birthday: null }));
    }
  };

  const handleGeneratePDF = async () => {
    // Validate all fields before generating PDF
    if (!firstName || !lastName || !birthday || 
        !validateName(firstName) || !validateName(lastName) || !validateBirthday(birthday)) {
      alert('Please correct all errors before generating PDF');
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
    <div style={{ 
      fontFamily: 'Arial',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <h1>Get Vaccinated and a PDF</h1>
      <div style={{ marginBottom: '20px' }}>
        <label>
          First Name:
          <input
            type="text"
            value={firstName}
            onChange={handleFirstNameChange}
            style={{ 
              marginLeft: '10px',
              borderColor: errors.firstName ? 'red' : undefined 
            }}
          />
        </label>
        {errors.firstName && (
          <div style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
            {errors.firstName}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>
          Last Name:
          <input
            type="text"
            value={lastName}
            onChange={handleLastNameChange}
            style={{ 
              marginLeft: '10px',
              borderColor: errors.lastName ? 'red' : undefined 
            }}
          />
        </label>
        {errors.lastName && (
          <div style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
            {errors.lastName}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>
          Birthday:
          <input
            type="date"
            value={birthday}
            onChange={handleBirthdayChange}
            style={{ 
              marginLeft: '10px',
              borderColor: errors.birthday ? 'red' : undefined 
            }}
          />
        </label>
        {errors.birthday && (
          <div style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
            {errors.birthday}
          </div>
        )}
      </div>

      <button
        onClick={handleGeneratePDF}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          cursor: 'pointer',
          opacity: Object.values(errors).some(error => error) ? 0.5 : 1
        }}
        disabled={Object.values(errors).some(error => error)}
      >
        Generate PDF
      </button>
    </div>
  );
}

export default VaccinationPDFGenerator;
