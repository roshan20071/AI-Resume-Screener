const fs = require('fs');

const dummyPDFBase64 = "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nDPQM1Qo5ypUMFAwALJMLU31jBQsTAz1LBSK0osS8/J0FVLzSjLTgVxNRSjX0MDIUC/AM9nPTM/U0M/AzEwPzEvJTMtILM5ITc7PTSxJzijNTVUAKtQzBvKASroGCoaG+sbmekZmSr4A5hsaKAlZ5peWZCbmKXjm5yQWZabmlSj4+iYnZual5pWEpBYlZ+YrhOXXA1UMDQxAAgD9ByTqCmVuZHN0cmVhbQplbmRvYmoKCjMgMCBvYmoKMTQ2CmVuZG9iagoKMSAwIG9iago8PC9UeXBlL1BhZ2UvTWVkaWFCb3hbMCAwIDU5NSA4NDJdL1Jlc291cmNlczw8L0ZvbnQ8PC9GMSA0IDAgUj4+Pj4vQ29udGVudHMgMiAwIFIvUGFyZW50IDUgMCBSPj4KZW5kb2JqCgo0IDAgb2JqCjw8L1R5cGUvRm9udC9TdWJ0eXBlL1R5cGUxL0Jhc2VGb250L0hlbHZldGljYT4+CmVuZG9iagoKNSAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1sxIDAgUl0+PgplbmRvYmoKCjYgMCBvYmoKPDwvVHlwZS9DYXRhbG9nL1BhZ2VzIDUgMCBSPj4KZW5kb2JqCgo3IDAgb2JqCjw8L1Byb2R1Y2VyKEdob3N0c2NyaXB0IDkuNTApL0NyZWF0aW9uRGF0ZShEOjIwMjQwMzEyMTAzMDAwWik+PgplbmRvYmoKCnhyZWYKMCA4CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDIxNyAwMDAwMCBuIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAxOTggMDAwMDAgbiAKMDAwMDAwMDMzNiAwMDAwMCBuIAowMDAwMDAwNDIzIDAwMDAwIG4gCjAwMDAwMDA0ODIgMDAwMDAgbiAKMDAwMDAwMDUzMSAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgOC9Sb290IDYgMCBSL0luZm8gNyAwIFIvSUQgWzw1RDAzNzJDRUY4NEJGQTBCREIzRDVEMzk2NTBFQjExRT48NUQwMzcyQ0VGODRCRkEwQkRCM0Q1RDM5NjUwRUIxMUU+XT4+CnN0YXJ0eHJlZgo2MjkKJSVFT0YK";

fs.writeFileSync('dummy.pdf', Buffer.from(dummyPDFBase64, 'base64'));

async function testUpload() {
  try {
    const formData = new FormData();
    formData.append('jobDescription', 'Looking for a Data Engineer with AWS experience.');
    
    const fileData = fs.readFileSync('dummy.pdf');
    const blob = new Blob([fileData], { type: 'application/pdf' });
    formData.append('resumes', blob, 'Roshan_Gatadi_DataEngineer_micro1.pdf');

    const response = await fetch('http://localhost:5000/api/screen', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

testUpload();
