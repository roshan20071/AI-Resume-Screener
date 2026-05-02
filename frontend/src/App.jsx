import React, { useState } from 'react';
import {
  Upload,
  Search,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  BookOpen,
  Briefcase
} from 'lucide-react';

const API_BASE = 'http://localhost:5000';

const AIResumeScreener = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [files, setFiles] = useState([]);
  const [jobDescription, setJobDescription] = useState('');

  const handleScreening = async () => {
    if (files.length === 0) {
      alert('Please upload at least one resume!');
      return;
    }

    if (!jobDescription.trim()) {
      alert('Please enter the job description!');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    files.forEach((file) => formData.append('resumes', file));
    formData.append('jobDescription', jobDescription);

    try {
      const response = await fetch(`${API_BASE}/api/screen`, {
        method: 'POST',
        body: formData
      });

      const rawText = await response.text();
      console.log('Raw server response:', rawText);

      if (!rawText || !rawText.trim()) {
        throw new Error('Server returned an empty response.');
      }

      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(`Server did not return valid JSON. Response was: ${rawText}`);
      }

      if (!response.ok) {
        throw new Error(data.error || 'Request failed.');
      }

      setResults(data.results || []);
    } catch (error) {
      console.error('Error screening resumes:', error);
      alert('Failed to connect to the backend brain: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-indigo-700 tracking-tight mb-2">
            AI Resume Screener
          </h1>
          <p className="text-slate-500 text-lg">
            Intelligently rank candidates based on semantic role requirements.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <FileText size={18} className="text-indigo-500" />
                1. Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job requirements here..."
                className="w-full h-48 p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-sm"
              />
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Upload size={18} className="text-indigo-500" />
                2. Upload Resumes
              </label>

              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer bg-slate-50">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  id="fileUpload"
                  onChange={(e) => setFiles(Array.from(e.target.files))}
                />
                <label htmlFor="fileUpload" className="cursor-pointer">
                  <Upload className="mx-auto text-slate-400 mb-2" size={32} />
                  <p className="text-xs text-slate-500">
                    {files.length > 0
                      ? `${files.length} file(s) selected`
                      : 'Drop PDFs here or click to browse'}
                  </p>
                </label>
              </div>

              <button
                onClick={handleScreening}
                disabled={loading}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
                {loading ? 'Analyzing...' : 'Run AI Screening'}
              </button>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[500px]">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                Screening Results
                <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                  Ranked by semantic match
                </span>
              </h2>

              {results.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <div className="bg-slate-50 p-4 rounded-full mb-4">
                    <FileText size={48} />
                  </div>
                  <p>Upload resumes and run the screening to see results.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((candidate, index) => (
                    <div
                      key={`${candidate.name}-${index}`}
                      className="group p-5 rounded-xl border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              candidate.status === 'error'
                                ? 'bg-red-100 text-red-600'
                                : candidate.score > 80
                                ? 'bg-green-100 text-green-600'
                                : 'bg-amber-100 text-amber-600'
                            }`}
                          >
                            {candidate.status === 'error' ? (
                              <AlertCircle size={20} />
                            ) : (
                              <CheckCircle size={20} />
                            )}
                          </div>
                          <h3 className="font-bold text-slate-700">{candidate.name}</h3>
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-2xl font-black ${
                              candidate.status === 'error'
                                ? 'text-red-500'
                                : candidate.score > 80
                                ? 'text-green-500'
                                : 'text-amber-500'
                            }`}
                          >
                            {candidate.score}%
                          </span>
                          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                            Match Score
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border-l-4 border-indigo-400 mb-4">
                        <p className="text-sm text-slate-600 italic">
                          <span className="font-bold text-indigo-700 not-italic">
                            AI Reasoning:{' '}
                          </span>
                          "{candidate.reasoning}"
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                          <h4 className="flex items-center gap-2 font-semibold text-blue-800 mb-3">
                            <BookOpen size={18} />
                            Skills to Learn
                          </h4>

                          {candidate.learningPath?.length > 0 ? (
                            <div className="space-y-3">
                              {candidate.learningPath.map((item, idx) => (
                                <div
                                  key={`${candidate.name}-skill-${idx}`}
                                  className="bg-white p-3 rounded-lg border border-blue-100"
                                >
                                  <p className="font-semibold text-slate-800">{item.skill}</p>
                                  <p className="text-sm text-slate-600 mt-1">{item.why}</p>
                                  <p className="text-xs text-slate-500 mt-2">
                                    <span className="font-semibold">How to learn:</span>{' '}
                                    {item.how_to_learn}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500">
                              No learning suggestions available.
                            </p>
                          )}
                        </div>

                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                          <h4 className="flex items-center gap-2 font-semibold text-emerald-800 mb-3">
                            <Briefcase size={18} />
                            Best Fit Roles
                          </h4>

                          {candidate.roleFit?.length > 0 ? (
                            <div className="space-y-3">
                              {candidate.roleFit.map((item, idx) => (
                                <div
                                  key={`${candidate.name}-role-${idx}`}
                                  className="bg-white p-3 rounded-lg border border-emerald-100"
                                >
                                  <p className="font-semibold text-slate-800">{item.role}</p>
                                  <p className="text-sm text-slate-600 mt-1">{item.why}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500">
                              No role recommendations available.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIResumeScreener;