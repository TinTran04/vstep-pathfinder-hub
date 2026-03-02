import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, FileText, DollarSign, Plus, Trash2, Edit2, Search,
  Save, Clock, TrendingUp, BookOpen, Activity, ArrowUpRight, BarChart3,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";

// --- Types ---
interface User {
  id: string; name: string; email: string; role: "admin" | "student";
  status: "active" | "inactive"; createdAt: string; examsCompleted: number;
}
interface Exam {
  id: string; title: string; skill: string; difficulty: string;
  questions: number; status: "active" | "draft"; uploadedAt: string;
}
interface PricePlan {
  id: string; name: string; price: number; period: string; features: string[];
}

// --- Mock data ---
const initialUsers: User[] = [
  { id: "1", name: "Nguyễn Văn A", email: "a@email.com", role: "student", status: "active", createdAt: "2026-01-15", examsCompleted: 12 },
  { id: "2", name: "Trần Thị B", email: "b@email.com", role: "student", status: "active", createdAt: "2026-02-01", examsCompleted: 8 },
  { id: "3", name: "Lê Văn C", email: "c@email.com", role: "admin", status: "active", createdAt: "2025-12-10", examsCompleted: 0 },
  { id: "4", name: "Phạm Thị D", email: "d@email.com", role: "student", status: "inactive", createdAt: "2026-01-20", examsCompleted: 3 },
  { id: "5", name: "Hoàng Minh E", email: "e@email.com", role: "student", status: "active", createdAt: "2026-02-15", examsCompleted: 15 },
];
const initialExams: Exam[] = [
  { id: "1", title: "Đề thi Listening #1", skill: "Listening", difficulty: "Dễ", questions: 35, status: "active", uploadedAt: "2026-02-15 10:30" },
  { id: "2", title: "Đề thi Reading #1", skill: "Reading", difficulty: "Trung bình", questions: 40, status: "active", uploadedAt: "2026-02-18 14:00" },
  { id: "3", title: "Đề thi Writing #1", skill: "Writing", difficulty: "Khó", questions: 2, status: "draft", uploadedAt: "2026-02-20 09:15" },
  { id: "4", title: "Đề thi Speaking #1", skill: "Speaking", difficulty: "Trung bình", questions: 3, status: "active", uploadedAt: "2026-02-22 16:45" },
  { id: "5", title: "Đề thi Listening #2", skill: "Listening", difficulty: "Trung bình", questions: 35, status: "active", uploadedAt: "2026-02-25 08:00" },
  { id: "6", title: "Đề thi Reading #2", skill: "Reading", difficulty: "Khó", questions: 40, status: "draft", uploadedAt: "2026-02-28 11:30" },
];
const initialPlans: PricePlan[] = [
  { id: "1", name: "Miễn phí", price: 0, period: "Mãi mãi", features: ["Truy cập 10 bài học cơ bản", "1 đề thi thử miễn phí"] },
  { id: "2", name: "Gói Tháng", price: 199000, period: "/tháng", features: ["Unlimited AI scoring", "Lộ trình học cá nhân hoá", "Toàn bộ đề thi"] },
  { id: "3", name: "Gói Tuần", price: 49000, period: "/tuần", features: ["Ôn thi ngắn hạn", "Truy cập đầy đủ đề thi", "AI scoring"] },
];

type Tab = "dashboard" | "users" | "exams" | "pricing";

const sidebarItems = [
  { title: "Dashboard", value: "dashboard" as Tab, icon: LayoutDashboard },
  { title: "Tài khoản", value: "users" as Tab, icon: Users },
  { title: "Đề thi", value: "exams" as Tab, icon: FileText },
  { title: "Quản lí giá", value: "pricing" as Tab, icon: DollarSign },
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [exams, setExams] = useState<Exam[]>(initialExams);
  const [plans, setPlans] = useState<PricePlan[]>(initialPlans);
  const [searchUser, setSearchUser] = useState("");
  const [searchExam, setSearchExam] = useState("");

  const [userDialog, setUserDialog] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({ name: "", email: "", role: "student" as "admin" | "student", status: "active" as "active" | "inactive" });

  const [examDialog, setExamDialog] = useState(false);
  const [editExam, setEditExam] = useState<Exam | null>(null);
  const [examForm, setExamForm] = useState({ title: "", skill: "Listening", difficulty: "Dễ", questions: 10, status: "draft" as "active" | "draft" });

  const [priceDialog, setPriceDialog] = useState(false);
  const [editPlan, setEditPlan] = useState<PricePlan | null>(null);
  const [priceForm, setPriceForm] = useState({ name: "", price: 0, period: "/tháng", features: "" });

  // User CRUD
  const openAddUser = () => { setEditUser(null); setUserForm({ name: "", email: "", role: "student", status: "active" }); setUserDialog(true); };
  const openEditUser = (u: User) => { setEditUser(u); setUserForm({ name: u.name, email: u.email, role: u.role, status: u.status }); setUserDialog(true); };
  const saveUser = () => {
    if (!userForm.name || !userForm.email) { toast.error("Vui lòng điền đầy đủ"); return; }
    if (editUser) { setUsers(p => p.map(u => u.id === editUser.id ? { ...u, ...userForm } : u)); toast.success("Cập nhật thành công"); }
    else { setUsers(p => [...p, { id: Date.now().toString(), ...userForm, createdAt: new Date().toISOString().split("T")[0], examsCompleted: 0 }]); toast.success("Thêm thành công"); }
    setUserDialog(false);
  };
  const deleteUser = (id: string) => { setUsers(p => p.filter(u => u.id !== id)); toast.success("Xóa thành công"); };

  // Exam CRUD
  const openAddExam = () => { setEditExam(null); setExamForm({ title: "", skill: "Listening", difficulty: "Dễ", questions: 10, status: "draft" }); setExamDialog(true); };
  const openEditExam = (e: Exam) => { setEditExam(e); setExamForm({ title: e.title, skill: e.skill, difficulty: e.difficulty, questions: e.questions, status: e.status }); setExamDialog(true); };
  const saveExam = () => {
    if (!examForm.title) { toast.error("Vui lòng nhập tên đề thi"); return; }
    const now = new Date();
    const timeStr = `${now.toISOString().split("T")[0]} ${now.toTimeString().slice(0, 5)}`;
    if (editExam) { setExams(p => p.map(e => e.id === editExam.id ? { ...e, ...examForm } : e)); toast.success("Cập nhật thành công"); }
    else { setExams(p => [...p, { id: Date.now().toString(), ...examForm, uploadedAt: timeStr }]); toast.success("Thêm thành công"); }
    setExamDialog(false);
  };
  const deleteExam = (id: string) => { setExams(p => p.filter(e => e.id !== id)); toast.success("Xóa thành công"); };

  // Price
  const openEditPrice = (p: PricePlan) => { setEditPlan(p); setPriceForm({ name: p.name, price: p.price, period: p.period, features: p.features.join("\n") }); setPriceDialog(true); };
  const savePrice = () => {
    if (!editPlan) return;
    setPlans(p => p.map(pl => pl.id === editPlan.id ? { ...pl, name: priceForm.name, price: priceForm.price, period: priceForm.period, features: priceForm.features.split("\n").filter(Boolean) } : pl));
    toast.success("Cập nhật giá thành công"); setPriceDialog(false);
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchUser.toLowerCase()) || u.email.toLowerCase().includes(searchUser.toLowerCase()));
  const filteredExams = exams.filter(e => e.title.toLowerCase().includes(searchExam.toLowerCase()));

  // Dashboard stats
  const totalStudents = users.filter(u => u.role === "student").length;
  const activeStudents = users.filter(u => u.role === "student" && u.status === "active").length;
  const totalExams = exams.length;
  const activeExams = exams.filter(e => e.status === "active").length;
  const totalRevenue = 2450000; // fake
  const skillDistribution = ["Listening", "Reading", "Writing", "Speaking"].map(s => ({
    skill: s, count: exams.filter(e => e.skill === s).length,
  }));

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Sidebar */}
        <Sidebar collapsible="icon">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 py-3">
                <Link to="/" className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-xs">V</span>
                  </div>
                  <span className="font-bold text-foreground text-sm">Admin Panel</span>
                </Link>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sidebarItems.map((item) => (
                    <SidebarMenuItem key={item.value}>
                      <SidebarMenuButton
                        onClick={() => setActiveTab(item.value)}
                        className={`cursor-pointer ${activeTab === item.value ? "bg-primary/10 text-primary font-medium" : ""}`}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border px-4 bg-card gap-3">
            <SidebarTrigger className="mr-2" />
            <h1 className="font-bold text-lg text-foreground">
              {sidebarItems.find(i => i.value === activeTab)?.title}
            </h1>
            <div className="ml-auto">
              <Button variant="ghost" size="sm" asChild><Link to="/">← Về trang chủ</Link></Button>
            </div>
          </header>

          <main className="flex-1 p-6 overflow-y-auto">
            {/* === DASHBOARD === */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                {/* Stats cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Tổng học viên", value: totalStudents, icon: Users, change: "+12%", color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Học viên hoạt động", value: activeStudents, icon: Activity, change: "+8%", color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Tổng đề thi", value: totalExams, icon: FileText, change: `${activeExams} active`, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Doanh thu tháng", value: `${(totalRevenue / 1000).toFixed(0)}K`, icon: DollarSign, change: "+23%", color: "text-purple-600", bg: "bg-purple-50" },
                  ].map((stat) => (
                    <Card key={stat.label} className="border-border">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                            <stat.icon size={20} className={stat.color} />
                          </div>
                          <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
                            <ArrowUpRight size={12} />{stat.change}
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Skill distribution & recent activity */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card className="border-border">
                    <CardContent className="p-5">
                      <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                        <BarChart3 size={18} className="text-primary" /> Phân bố đề thi theo kỹ năng
                      </h3>
                      <div className="space-y-3">
                        {skillDistribution.map(s => (
                          <div key={s.skill} className="flex items-center gap-3">
                            <span className="text-sm font-medium text-foreground w-20">{s.skill}</span>
                            <Progress value={(s.count / Math.max(totalExams, 1)) * 100} className="flex-1 h-3" />
                            <span className="text-sm font-bold text-foreground w-8 text-right">{s.count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border">
                    <CardContent className="p-5">
                      <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-primary" /> Hoạt động gần đây
                      </h3>
                      <div className="space-y-3">
                        {[
                          { text: "Nguyễn Văn A hoàn thành Listening #1", time: "5 phút trước", type: "exam" },
                          { text: "Đề thi Reading #2 được thêm mới", time: "1 giờ trước", type: "add" },
                          { text: "Trần Thị B đăng ký Gói Tháng", time: "2 giờ trước", type: "payment" },
                          { text: "Hoàng Minh E đạt 8.5/10 Writing", time: "3 giờ trước", type: "exam" },
                          { text: "Phạm Thị D cập nhật hồ sơ", time: "5 giờ trước", type: "user" },
                        ].map((act, i) => (
                          <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                            <div className={`w-2 h-2 rounded-full mt-1.5 ${act.type === "payment" ? "bg-emerald-500" : act.type === "exam" ? "bg-primary" : "bg-amber-500"}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground">{act.text}</p>
                              <p className="text-xs text-muted-foreground">{act.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top students */}
                <Card className="border-border">
                  <CardContent className="p-5">
                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                      <BookOpen size={18} className="text-primary" /> Top học viên tích cực
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Tên</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Bài đã làm</TableHead>
                          <TableHead>Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.filter(u => u.role === "student").sort((a, b) => b.examsCompleted - a.examsCompleted).slice(0, 5).map((u, i) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-bold text-primary">{i + 1}</TableCell>
                            <TableCell className="font-medium">{u.name}</TableCell>
                            <TableCell className="text-muted-foreground">{u.email}</TableCell>
                            <TableCell><Badge variant="secondary">{u.examsCompleted} bài</Badge></TableCell>
                            <TableCell>
                              <Badge variant="outline" className={u.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}>
                                {u.status === "active" ? "Hoạt động" : "Ngưng"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* === USERS === */}
            {activeTab === "users" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Tìm theo tên hoặc email..." className="pl-9" value={searchUser} onChange={e => setSearchUser(e.target.value)} />
                  </div>
                  <Button onClick={openAddUser} className="gradient-primary text-primary-foreground gap-2"><Plus size={16} /> Thêm tài khoản</Button>
                </div>
                <Card className="border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên</TableHead><TableHead>Email</TableHead><TableHead>Vai trò</TableHead>
                        <TableHead>Trạng thái</TableHead><TableHead>Ngày tạo</TableHead><TableHead className="text-right">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map(u => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell><Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role === "admin" ? "Admin" : "Học viên"}</Badge></TableCell>
                          <TableCell><Badge variant="outline" className={u.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}>{u.status === "active" ? "Hoạt động" : "Ngưng"}</Badge></TableCell>
                          <TableCell className="text-muted-foreground text-sm">{u.createdAt}</TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button size="icon" variant="ghost" onClick={() => openEditUser(u)}><Edit2 size={14} /></Button>
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteUser(u.id)}><Trash2 size={14} /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            )}

            {/* === EXAMS === */}
            {activeTab === "exams" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Tìm đề thi..." className="pl-9" value={searchExam} onChange={e => setSearchExam(e.target.value)} />
                  </div>
                  <Button onClick={openAddExam} className="gradient-primary text-primary-foreground gap-2"><Plus size={16} /> Thêm đề thi</Button>
                </div>
                <Card className="border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên đề</TableHead><TableHead>Kỹ năng</TableHead><TableHead>Độ khó</TableHead>
                        <TableHead>Số câu</TableHead><TableHead>Trạng thái</TableHead>
                        <TableHead><Clock size={14} className="inline mr-1" />Thời gian up</TableHead>
                        <TableHead className="text-right">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExams.map(e => (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium">{e.title}</TableCell>
                          <TableCell><Badge variant="outline">{e.skill}</Badge></TableCell>
                          <TableCell>{e.difficulty}</TableCell>
                          <TableCell>{e.questions}</TableCell>
                          <TableCell><Badge variant={e.status === "active" ? "default" : "secondary"}>{e.status === "active" ? "Active" : "Draft"}</Badge></TableCell>
                          <TableCell className="text-muted-foreground text-sm">{e.uploadedAt}</TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button size="icon" variant="ghost" onClick={() => openEditExam(e)}><Edit2 size={14} /></Button>
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteExam(e.id)}><Trash2 size={14} /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            )}

            {/* === PRICING === */}
            {activeTab === "pricing" && (
              <div className="grid md:grid-cols-3 gap-6">
                {plans.map(p => (
                  <Card key={p.id} className="border-border">
                    <CardContent className="p-6 space-y-4">
                      <div className="text-center">
                        <h3 className="font-bold text-lg text-foreground">{p.name}</h3>
                        <p className="text-3xl font-extrabold text-foreground mt-2">{p.price.toLocaleString("vi-VN")}đ<span className="text-sm font-normal text-muted-foreground">{p.period}</span></p>
                      </div>
                      <ul className="space-y-2">
                        {p.features.map((f, i) => <li key={i} className="text-sm text-muted-foreground">• {f}</li>)}
                      </ul>
                      <Button variant="outline" className="w-full gap-2" onClick={() => openEditPrice(p)}><Edit2 size={14} /> Chỉnh giá</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* User Dialog */}
      <Dialog open={userDialog} onOpenChange={setUserDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editUser ? "Chỉnh sửa tài khoản" : "Thêm tài khoản"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Họ tên</Label><Input value={userForm.name} onChange={e => setUserForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Email</Label><Input value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div><Label>Vai trò</Label>
              <Select value={userForm.role} onValueChange={v => setUserForm(p => ({ ...p, role: v as any }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="student">Học viên</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select>
            </div>
            <div><Label>Trạng thái</Label>
              <Select value={userForm.status} onValueChange={v => setUserForm(p => ({ ...p, status: v as any }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Hoạt động</SelectItem><SelectItem value="inactive">Ngưng</SelectItem></SelectContent></Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setUserDialog(false)}>Hủy</Button><Button onClick={saveUser} className="gradient-primary text-primary-foreground"><Save size={14} /> Lưu</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exam Dialog */}
      <Dialog open={examDialog} onOpenChange={setExamDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editExam ? "Chỉnh sửa đề thi" : "Thêm đề thi mới"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Tên đề</Label><Input value={examForm.title} onChange={e => setExamForm(p => ({ ...p, title: e.target.value }))} /></div>
            <div><Label>Kỹ năng</Label>
              <Select value={examForm.skill} onValueChange={v => setExamForm(p => ({ ...p, skill: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Listening">Listening</SelectItem><SelectItem value="Reading">Reading</SelectItem><SelectItem value="Writing">Writing</SelectItem><SelectItem value="Speaking">Speaking</SelectItem></SelectContent></Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Độ khó</Label>
                <Select value={examForm.difficulty} onValueChange={v => setExamForm(p => ({ ...p, difficulty: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Dễ">Dễ</SelectItem><SelectItem value="Trung bình">Trung bình</SelectItem><SelectItem value="Khó">Khó</SelectItem></SelectContent></Select>
              </div>
              <div><Label>Số câu</Label><Input type="number" value={examForm.questions} onChange={e => setExamForm(p => ({ ...p, questions: Number(e.target.value) }))} /></div>
            </div>
            <div><Label>Trạng thái</Label>
              <Select value={examForm.status} onValueChange={v => setExamForm(p => ({ ...p, status: v as any }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem></SelectContent></Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setExamDialog(false)}>Hủy</Button><Button onClick={saveExam} className="gradient-primary text-primary-foreground"><Save size={14} /> Lưu</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Price Dialog */}
      <Dialog open={priceDialog} onOpenChange={setPriceDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Chỉnh sửa gói giá</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Tên gói</Label><Input value={priceForm.name} onChange={e => setPriceForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Giá (VND)</Label><Input type="number" value={priceForm.price} onChange={e => setPriceForm(p => ({ ...p, price: Number(e.target.value) }))} /></div>
            <div><Label>Chu kỳ</Label><Input value={priceForm.period} onChange={e => setPriceForm(p => ({ ...p, period: e.target.value }))} /></div>
            <div><Label>Tính năng (mỗi dòng 1 tính năng)</Label><Textarea value={priceForm.features} onChange={e => setPriceForm(p => ({ ...p, features: e.target.value }))} rows={4} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setPriceDialog(false)}>Hủy</Button><Button onClick={savePrice} className="gradient-primary text-primary-foreground"><Save size={14} /> Lưu</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default Admin;
