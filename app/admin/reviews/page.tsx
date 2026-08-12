"use client";

import { useEffect, useState } from "react";

type R = {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
  business_id: number;
  businesses?: { name: string } | null;
};

export default function AdminReviews() {
  const [token, setToken] = useState("");
  const [reviews, setReviews] = useState<R[]>([]);
  const [err, setErr] = useState("");
  const headers = () => ({ "content-type": "application/json", ...(token ? { "x-admin-token": token } : {}) });

  async function load() {
    setErr("");
    const r = await fetch("/api/admin/reviews", { headers: headers() });
    const j = await r.json();
    if (!r.ok) {
      setErr(j.error ?? "Unauthorized");
      return;
    }
    setReviews(j.reviews ?? []);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setApproved(id: string, val: boolean) {
    const r = await fetch("/api/admin/reviews", { method: "PATCH", headers: headers(), body: JSON.stringify({ id, is_approved: val }) });
    if (r.ok) setReviews((rs) => rs.map((x) => (x.id === id ? { ...x, is_approved: val } : x)));
    else setErr("Update failed");
  }

  return (
    <div style={{ maxWidth: 880, margin: "40px auto", fontFamily: "system-ui", padding: 20 }}>
      <h1 style={{ marginBottom: 4 }}>Review Moderation</h1>
      <p style={{ fontSize: 13, opacity: 0.6, marginTop: 0 }}>
        Approve or reject customer reviews. Set <code>ADMIN_TOKEN</code> in <code>.env</code> to lock this down in production.
      </p>
      <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="admin token (optional in dev)"
          style={{ padding: 8, flex: 1, maxWidth: 320 }}
        />
        <button onClick={load} style={{ padding: "8px 16px", cursor: "pointer" }}>
          Reload
        </button>
      </div>
      {err && <p style={{ color: "red" }}>{err}</p>}
      <table style={{ width: "100%", marginTop: 12, borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", opacity: 0.6 }}>
            <th>Business</th>
            <th>Reviewer</th>
            <th>Rating</th>
            <th>Comment</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((r) => (
            <tr key={r.id} style={{ borderTop: "1px solid #eee" }}>
              <td style={{ padding: "8px 6px" }}>{r.businesses?.name ?? r.business_id}</td>
              <td style={{ padding: "8px 6px" }}>{r.reviewer_name}</td>
              <td style={{ padding: "8px 6px" }}>★{r.rating}</td>
              <td style={{ padding: "8px 6px", maxWidth: 300 }}>{r.comment}</td>
              <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>{r.is_approved ? "✅ approved" : "⏳ pending"}</td>
              <td style={{ padding: "8px 6px" }}>
                {r.is_approved ? (
                  <button onClick={() => setApproved(r.id, false)}>Reject</button>
                ) : (
                  <button onClick={() => setApproved(r.id, true)}>Approve</button>
                )}
              </td>
            </tr>
          ))}
          {reviews.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: 16, textAlign: "center", opacity: 0.5 }}>
                No reviews found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
