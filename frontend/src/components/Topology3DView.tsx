import React, { useState } from 'react';
import { ShieldCheck, Database, Key, Lock, Layers, CheckCircle2, ChevronRight, Terminal } from 'lucide-react';

interface RoleNode {
  id: string;
  name: string;
  postgresRole: string;
  description: string;
  privileges: string[];
  restrictions: string[];
  color: string;
  neonNote: string;
}

const ROLES: RoleNode[] = [
  {
    id: 'owner',
    name: 'Project Owner',
    postgresRole: 'neondb_owner',
    description: 'Schema owner and migration executor. Owns the security definer bootstrap function.',
    privileges: [
      'CREATE TABLE, ALTER TABLE, DROP TABLE',
      'OWNER OF bootstrap_first_admin()',
      'Prisma migration runner',
    ],
    restrictions: [
      'Not used by the running web application backend',
      'Cannot execute superuser-only commands in Neon without 42501',
    ],
    color: '#06b6d4',
    neonNote: 'Operates strictly in owner scope; does not manage non-owned system roles.',
  },
  {
    id: 'app',
    name: 'Application Runtime',
    postgresRole: 'bv_app_runtime',
    description: 'Least-privilege role used by the Node.js API service for everyday operational queries.',
    privileges: [
      'SELECT, INSERT, UPDATE on User, Account, LedgerEntry',
      'INSERT, SELECT on AuditLog',
    ],
    restrictions: [
      'REVOKE UPDATE, DELETE, TRUNCATE ON "AuditLog"',
      'No schema alteration rights',
      'Cannot execute administrative bootstrap functions',
    ],
    color: '#10b981',
    neonNote: 'Guarantees append-only audit trail immutability at the database permission level.',
  },
  {
    id: 'bootstrap',
    name: 'Bootstrap Operator',
    postgresRole: 'bootstrap_operator',
    description: 'Highly restricted role used solely during initial platform deployment to create the first admin.',
    privileges: [
      'GRANT EXECUTE ON FUNCTION bootstrap_first_admin(...)',
      'Can only create first admin if zero admins currently exist',
    ],
    restrictions: [
      'NOLOGIN operator role (invoked via SET ROLE from dedicated login user)',
      'No direct table access to User or Account',
      'Inoperative once initial administrator is provisioned',
    ],
    color: '#f59e0b',
    neonNote: 'Executes via SECURITY DEFINER, eliminating the need to alter credentials or administer roles.',
  },
];

export const Topology3DView: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<RoleNode>(ROLES[1]); // default App runtime

  return (
    <div style={{
      background: 'linear-gradient(145deg, #0f172a 0%, #090d16 100%)',
      borderRadius: '12px',
      border: '1px solid #1e293b',
      padding: '1.5rem',
      marginBottom: '1.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
        <Layers size={20} color="#38bdf8" />
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
            Interactive PostgreSQL Least-Privilege Architecture
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Section 8.1: Managed Neon database role model solving SQLSTATE 42501
          </p>
        </div>
      </div>

      {/* 3D Visual Role Nodes Navigation */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '0.85rem',
        marginBottom: '1.25rem',
        perspective: '800px',
      }}>
        {ROLES.map((r) => {
          const isSelected = selectedRole.id === r.id;
          return (
            <div
              key={r.id}
              onClick={() => setSelectedRole(r)}
              style={{
                background: isSelected ? 'rgba(30, 41, 59, 0.9)' : '#090d16',
                border: `1px solid ${isSelected ? r.color : '#1e293b'}`,
                borderRadius: '10px',
                padding: '1rem',
                cursor: 'pointer',
                boxShadow: isSelected ? `0 0 15px ${r.color}33` : 'none',
                transform: isSelected ? 'translateZ(10px) scale(1.02)' : 'translateZ(0) scale(1.0)',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: r.color, textTransform: 'uppercase' }}>
                  {r.name}
                </span>
                <span className="badge" style={{
                  backgroundColor: `${r.color}22`,
                  color: r.color,
                  border: `1px solid ${r.color}44`,
                  fontSize: '0.65rem'
                }}>
                  {r.postgresRole}
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
                {r.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Active Role Deep Dive Panel */}
      <div style={{
        backgroundColor: '#090d16',
        borderRadius: '8px',
        border: '1px solid #1e293b',
        padding: '1.25rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <ShieldCheck size={18} color={selectedRole.color} />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
            Role Specifications: <code style={{ color: selectedRole.color }}>{selectedRole.postgresRole}</code>
          </h4>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          {/* Granted Privileges */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#34d399', marginBottom: '0.4rem' }}>
              ✔ Permitted Capabilities:
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {selectedRole.privileges.map((p, i) => (
                <li key={i} style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <code className="font-mono" style={{ color: '#34d399' }}>+</code> {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Enforced Boundaries */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f87171', marginBottom: '0.4rem' }}>
              ✕ Enforced Security Boundaries:
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {selectedRole.restrictions.map((r, i) => (
                <li key={i} style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <code className="font-mono" style={{ color: '#f87171' }}>-</code> {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Neon Mitigation Explainer */}
        <div style={{
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '6px',
          padding: '0.625rem 0.85rem',
          fontSize: '0.75rem',
          color: '#7dd3fc',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <Terminal size={14} color="#38bdf8" style={{ flexShrink: 0 }} />
          <span>
            <strong>Neon Environment Note:</strong> {selectedRole.neonNote}
          </span>
        </div>
      </div>
    </div>
  );
};
