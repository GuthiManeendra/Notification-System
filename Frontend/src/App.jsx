import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Table, Button, Modal, Form, Navbar, Nav, Card, Alert, Badge, Row, Col } from 'react-bootstrap';

const API_BASE = 'https://notification-system-pxna.onrender.com/api';

const TRIGGERS = [
  { key: 'login', label: 'Login', icon: 'fa-solid fa-right-to-bracket', colorClass: 'text-cyan-accent', badgeColor: 'info' },
  { key: 'logout', label: 'Logout', icon: 'fa-solid fa-right-from-bracket', colorClass: 'text-rose-accent', badgeColor: 'danger' },
  { key: 'inactive_1day', label: 'Inactive (1 Day)', icon: 'fa-solid fa-clock-rotate-left', colorClass: 'text-amber-accent', badgeColor: 'warning' },
  { key: 'inactive_1week', label: 'Inactive (1 Week)', icon: 'fa-solid fa-calendar-xmark', colorClass: 'text-indigo-accent', badgeColor: 'primary' },
];

const CHANNELS = [
  { key: 'whatsapp', label: 'WhatsApp', icon: 'fa-brands fa-whatsapp', color: 'text-success' },
  { key: 'email', label: 'Email', icon: 'fa-solid fa-envelope-open-text', color: 'text-info' },
  { key: 'web_push', label: 'Web Push', icon: 'fa-solid fa-bell', color: 'text-warning' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('admin');
  const [matrixData, setMatrixData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentCell, setCurrentCell] = useState({ trigger: '', channel: '', title: '', body: '', is_active: true, id: null });
  const [recipient, setRecipient] = useState('maneendramani37@gmail.com');
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    fetchMatrix();
  }, []);

  const fetchMatrix = async () => {
    try {
      const res = await axios.get(`${API_BASE}/matrix/`);
      setMatrixData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getCellData = (trigger, channel) => {
    return matrixData.find(item => item.trigger === trigger && item.channel === channel);
  };

  const handleOpenModal = (trigger, channel) => {
    const existing = getCellData(trigger, channel);
    if (existing) {
      setCurrentCell(existing);
    } else {
      setCurrentCell({ trigger, channel, title: '', body: '', is_active: true, id: null });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (currentCell.id) {
        await axios.put(`${API_BASE}/matrix/${currentCell.id}/`, currentCell);
      } else {
        const existing = matrixData.find(
          item => item.trigger === currentCell.trigger && item.channel === currentCell.channel
        );
        if (existing) {
          await axios.put(`${API_BASE}/matrix/${existing.id}/`, {
            ...currentCell,
            id: existing.id
          });
        } else {
          try {
            await axios.post(`${API_BASE}/matrix/`, currentCell);
          } catch (postErr) {
            // Fallback: If backend returns a unique constraint error, fetch fresh data and update the existing record
            if (postErr.response?.data?.non_field_errors || postErr.response?.data?.trigger) {
              const freshRes = await axios.get(`${API_BASE}/matrix/`);
              const conflictedItem = freshRes.data.find(
                item => item.trigger === currentCell.trigger && item.channel === currentCell.channel
              );
              if (conflictedItem) {
                await axios.put(`${API_BASE}/matrix/${conflictedItem.id}/`, {
                  ...currentCell,
                  id: conflictedItem.id
                });
              } else {
                throw postErr;
              }
            } else {
              throw postErr;
            }
          }
        }
      }
      setShowModal(false);
      fetchMatrix();
      setStatusMsg(null);
    } catch (err) {
      console.error(err);
      setStatusMsg(`Error saving template: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
    }
  };

  const handleToggle = async (cell) => {
    if (!cell) return;
    const updated = { ...cell, is_active: !cell.is_active };
    try {
      await axios.put(`${API_BASE}/matrix/${cell.id}/`, updated);
      fetchMatrix();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestSend = async () => {
    try {
      const res = await axios.post(`${API_BASE}/test-send/`, {
        channel: currentCell.channel,
        title: currentCell.title,
        body: currentCell.body,
        recipient: recipient
      });
      setStatusMsg(`Test sent successfully: ${JSON.stringify(res.data.response)}`);
    } catch (err) {
      setStatusMsg(`Error sending test: ${err.message}`);
    }
  };

  const fireTriggerEvent = async (triggerKey) => {
    try {
      const res = await axios.post(`${API_BASE}/fire-trigger/`, {
        trigger: triggerKey,
        test_phone: recipient,
        test_email: recipient
      });
      setStatusMsg(`Trigger fired! Results: ${JSON.stringify(res.data.results)}`);
    } catch (err) {
      setStatusMsg(`Error firing trigger: ${err.message}`);
    }
  };

  return (
    <div className="cyber-root min-vh-100 pb-5 text-white">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        
        .cyber-root {
          background-color: #07090f;
          color: #ffffff !important;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background-image: 
            radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.12) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(99, 102, 241, 0.12) 0px, transparent 50%);
        }

        .text-gradient-primary {
          background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .text-cyan-accent { color: #38bdf8 !important; }
        .text-rose-accent { color: #fb7185 !important; }
        .text-amber-accent { color: #fbbf24 !important; }
        .text-indigo-accent { color: #818cf8 !important; }

        .glass-nav {
          background: rgba(11, 15, 25, 0.95) !important;
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(56, 189, 248, 0.2) !important;
        }

        .glass-card {
          background: linear-gradient(145deg, rgba(22, 30, 46, 0.9), rgba(15, 22, 36, 0.95));
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 12px 35px 0 rgba(0, 0, 0, 0.5);
          color: #ffffff !important;
        }

        .card-cyan {
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%);
          border-left: 4px solid #0ea5e9 !important;
        }
        .card-rose {
          background: linear-gradient(135deg, rgba(244, 63, 94, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%);
          border-left: 4px solid #f43f5e !important;
        }
        .card-amber {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%);
          border-left: 4px solid #f59e0b !important;
        }
        .card-indigo {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%);
          border-left: 4px solid #6366f1 !important;
        }

        .simulator-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .simulator-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.7);
        }

        .glass-cell {
          background: rgba(11, 15, 25, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.25s ease;
        }
        .glass-cell:hover {
          border-color: rgba(56, 189, 248, 0.5);
          box-shadow: 0 4px 20px rgba(56, 189, 248, 0.2);
        }

        .btn-neon-primary {
          background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);
          border: none;
          color: #ffffff !important;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .btn-neon-primary:hover {
          background: linear-gradient(135deg, #0284c7 0%, #4f46e5 100%);
          box-shadow: 0 0 15px rgba(14, 165, 233, 0.5);
          color: #ffffff !important;
        }

        .table-cyber {
          background-color: transparent !important;
          color: #ffffff !important;
        }
        .table-cyber th, .table-cyber td {
          border-color: rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
        }

        .form-control-cyber {
          background-color: rgba(11, 15, 25, 0.95) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          color: #ffffff !important;
        }
        .form-control-cyber:focus {
          background-color: rgba(11, 15, 25, 1) !important;
          border-color: #38bdf8;
          box-shadow: 0 0 0 0.25rem rgba(56, 189, 248, 0.25);
          color: #ffffff !important;
        }
        .form-control-cyber::placeholder {
          color: #94a3b8 !important;
        }

        .nav-link {
          color: #cbd5e1 !important;
          font-weight: 500;
        }
        .nav-link.active {
          color: #ffffff !important;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fadeIn 0.3s ease-in-out forwards;
        }
      `}</style>

      <Navbar expand="lg" className="px-4 py-3 glass-nav sticky-top">
        <Navbar.Brand href="#" className="fw-bold tracking-wide d-flex align-items-center gap-2">
          <div className="p-2 rounded-3 bg-gradient bg-primary text-white shadow-sm d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
            <i className="fa-solid fa-shield-halved fs-5"></i>
          </div>
          <span className="text-white">Notification <span className="text-gradient-primary">System</span></span>
        </Navbar.Brand>
        <Nav className="ms-auto flex-row gap-2">
          <Nav.Link 
            active={activeTab === 'admin'} 
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-2 rounded-3 transition-all ${activeTab === 'admin' ? 'bg-primary text-white shadow-sm' : ''}`}
          >
            <i className="fa-solid fa-sliders me-1"></i> Admin Panel
          </Nav.Link>
          <Nav.Link 
            active={activeTab === 'simulator'} 
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-2 rounded-3 transition-all ${activeTab === 'simulator' ? 'bg-primary text-white shadow-sm' : ''}`}
          >
            <i className="fa-solid fa-microchip me-1"></i> Simulator
          </Nav.Link>
        </Nav>
      </Navbar>

      <Container className="py-4 fade-in">
        {statusMsg && (
          <Alert variant="info" onClose={() => setStatusMsg(null)} dismissible className="shadow-sm glass-card border-info text-info mb-4 fw-medium">
            <span><i className="fa-solid fa-circle-info me-2"></i> {statusMsg}</span>
          </Alert>
        )}

        {activeTab === 'admin' ? (
          <div className="glass-card p-4 rounded-4 shadow-lg fade-in">
            <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <h2 className="fw-bold text-white mb-1">Notification Settings Matrix</h2>
                <p className="text-light opacity-75 mb-0 small">Fine-tune automated messaging rules, channel statuses, and content templates.</p>
              </div>
              <Badge bg="dark" className="border border-secondary px-3 py-2 text-info fw-normal">
                <i className="fa-solid fa-circle-dot me-1 text-success"></i> <span className="text-success fw-semibold">System Online</span>
              </Badge>
            </div>
            <div className="table-responsive">
              <Table hover className="align-middle mb-0 table-cyber">
                <thead>
                  <tr className="text-uppercase fs-7 text-info">
                    <th className="py-3 ps-3">Trigger Event</th>
                    {CHANNELS.map(ch => (
                      <th key={ch.key} className="py-3 text-center">
                        <i className={`${ch.icon} me-1 ${ch.color}`}></i> <span className={ch.color}>{ch.label}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TRIGGERS.map(t => (
                    <tr key={t.key}>
                      <td className="ps-3 py-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className={`p-2 rounded bg-dark border border-secondary text-center shadow-sm ${t.colorClass}`} style={{ width: '34px' }}>
                            <i className={t.icon}></i>
                          </div>
                          <div>
                            <strong className={`d-block ${t.colorClass}`}>{t.label}</strong>
                            <small className="font-monospace text-light opacity-50">{t.key}</small>
                          </div>
                        </div>
                      </td>
                      {CHANNELS.map(ch => {
                        const cell = getCellData(t.key, ch.key);
                        return (
                          <td key={ch.key} className="p-3 text-center" style={{ width: '25%' }}>
                            {cell ? (
                              <div className="p-3 rounded-3 glass-cell text-start shadow-sm">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <Badge bg={cell.is_active ? 'success' : 'secondary'} className="px-2 py-1 text-uppercase tracking-wider fs-8 fw-bold">
                                    {cell.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                                <p className="small text-white opacity-90 text-truncate mb-3" style={{ maxWidth: '200px' }}>
                                  {cell.body || <span className="fst-italic text-light opacity-50">No message content set...</span>}
                                </p>
                                <div className="d-flex gap-2">
                                  <Button size="sm" variant="outline-light" className="w-50 py-1 fs-7 border-secondary text-white" onClick={() => handleOpenModal(t.key, ch.key)}>
                                    <i className="fa-solid fa-pen-to-square me-1"></i> Edit
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant={cell.is_active ? "outline-danger" : "outline-success"} 
                                    className="w-50 py-1 fs-7 fw-semibold"
                                    onClick={() => handleToggle(cell)}
                                  >
                                    {cell.is_active ? 'Disable' : 'Enable'}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button size="sm" variant="outline-primary" className="w-100 py-3 border-dashed border-info text-info bg-transparent fw-semibold" onClick={() => handleOpenModal(t.key, ch.key)}>
                                <i className="fa-solid fa-plus me-1"></i> Add Template
                              </Button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="glass-card p-4 rounded-4 shadow-lg fade-in">
            <div className="mb-4">
              <h2 className="fw-bold text-white mb-1">Website Event Simulator</h2>
              <p className="text-light opacity-75 small">Trigger mock user behaviors to test live notification workflows instantly.</p>
            </div>
            
            <Row className="mb-4">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-white small text-uppercase tracking-wide">Target Destination (Email / Phone)</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={recipient} 
                    onChange={e => setRecipient(e.target.value)} 
                    placeholder="Enter destination..."
                    className="form-control-cyber shadow-sm py-2"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              {TRIGGERS.map((t, idx) => {
                const cardThemeClass = idx === 0 ? 'card-cyan' : idx === 1 ? 'card-rose' : idx === 2 ? 'card-amber' : 'card-indigo';
                return (
                  <Col md={3} sm={6} key={t.key}>
                    <Card className={`glass-card simulator-card h-100 shadow-sm ${cardThemeClass}`}>
                      <Card.Body className="d-flex flex-column justify-content-between p-3">
                        <div>
                          <div className={`p-2 rounded bg-dark border border-secondary d-inline-block mb-3 text-center shadow-sm ${t.colorClass}`} style={{ width: '38px' }}>
                            <i className={`${t.icon} fs-5`}></i>
                          </div>
                          <Card.Title className={`h6 fw-bold mb-1 ${t.colorClass}`}>{t.label}</Card.Title>
                          <Card.Text className="text-white opacity-85 small mb-3">Simulate an app-level hook for this event type.</Card.Text>
                        </div>
                        <Button variant="primary" size="sm" className="w-100 btn-neon-primary py-2 shadow-sm" onClick={() => fireTriggerEvent(t.key)}>
                          <i className="fa-solid fa-bolt me-1"></i> Fire Event
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>
        )}
      </Container>

      {/* Edit / Create Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered contentClassName="glass-card border border-secondary shadow-lg text-white">
        <Modal.Header closeButton closeVariant="white" className="border-secondary pb-3">
          <Modal.Title className="fw-bold fs-5 text-white">
            <i className="fa-solid fa-gears me-2 text-info"></i> Configure Template 
            <span className="text-info opacity-75 fs-6 ms-2">({currentCell.trigger} / {currentCell.channel})</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3">
          <Form>
            {currentCell.channel !== 'whatsapp' && (
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold text-white small text-uppercase">Title / Subject</Form.Label>
                <Form.Control 
                  type="text" 
                  value={currentCell.title || ''} 
                  onChange={e => setCurrentCell({...currentCell, title: e.target.value})} 
                  placeholder="Notification title..."
                  className="form-control-cyber"
                />
              </Form.Group>
            )}
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold text-white small text-uppercase">Message Body</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={4} 
                value={currentCell.body || ''} 
                onChange={e => setCurrentCell({...currentCell, body: e.target.value})} 
                placeholder="Write your template payload here..."
                className="form-control-cyber"
              />
            </Form.Group>
            <Form.Group className="mb-3 bg-dark p-3 rounded-3 border border-secondary">
              <Form.Check 
                type="switch" 
                label="Enable Channel Matrix Cell" 
                checked={currentCell.is_active} 
                onChange={e => setCurrentCell({...currentCell, is_active: e.target.checked})} 
                className="fw-semibold text-white"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label className="fw-semibold text-white small text-uppercase">Test Recipient Address</Form.Label>
              <Form.Control 
                type="text" 
                value={recipient} 
                onChange={e => setRecipient(e.target.value)} 
                placeholder="Email or phone for testing..."
                className="form-control-cyber"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-secondary pt-0">
          <Button variant="outline-secondary" className="border-secondary text-white" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="outline-info" onClick={handleTestSend}>Test Send</Button>
          <Button variant="primary" className="btn-neon-primary" onClick={handleSave}>Save Changes</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}