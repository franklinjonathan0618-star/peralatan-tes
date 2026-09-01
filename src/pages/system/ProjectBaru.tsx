import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Building2, ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useProjects, useAddProject, useDeleteProject } from '@/hooks/useProjects';

const ProjectBaru = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: projects = [], isLoading } = useProjects();
  const { mutateAsync: addProject, isPending: isAdding } = useAddProject();
  const { mutateAsync: deleteProject } = useDeleteProject();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama_project: '',
    cabang: 'Papua', // Default cabang
  });

  const handleCreateProject = async () => {
    if (!formData.nama_project.trim()) {
      alert('Nama project harus diisi');
      return;
    }

    try {
      const newProject = await addProject(formData);

      // Otomatis pilih project yang baru dibuat
      const projectData = {
        id: newProject.id,
        namaProject: newProject.nama_project,
        cabang: newProject.cabang,
      };
      localStorage.setItem('activeProject', JSON.stringify(projectData));

      // Clear all query cache to show empty data for new project
      queryClient.clear();

      setFormData({ nama_project: '', cabang: 'Papua' });
      setIsDialogOpen(false);

      alert(`Project "${newProject.nama_project}" berhasil dibuat. Semua data akan kosong untuk project baru ini.`);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleSelectProject = (project: any) => {
    // Update nama cabang di navbar sesuai project yang dipilih
    const projectData = {
      id: project.id,
      namaProject: project.nama_project,
      cabang: project.cabang,
    };
    localStorage.setItem('activeProject', JSON.stringify(projectData));

    // Clear all query cache to show data for selected project
    queryClient.clear();

    alert(`Project "${project.nama_project}" dipilih. Data akan dimuat untuk project ini.`);
    navigate('/dashboard');
  };

  const handleDeleteProject = async (id: string, namaProject: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus project "${namaProject}"? Data yang terkait akan tetap ada tetapi tidak akan bisa diakses.`)) {
      return;
    }

    try {
      await deleteProject(id);
      alert(`Project "${namaProject}" berhasil dihapus.`);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Project Baru</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Buat dan kelola project baru
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Daftar Project
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Project Baru
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto mb-4"></div>
              <p>Memuat data project...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Belum ada project yang dibuat</p>
              <p className="text-sm mt-2">Klik tombol "Project Baru" untuk membuat project pertama</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <h3 className="font-medium">{project.nama_project}</h3>
                    <p className="text-sm text-muted-foreground">{project.cabang}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectProject(project)}
                    >
                      Pilih Project
                    </Button>
                    {project.id !== 'default-project' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteProject(project.id, project.nama_project)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Project Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cabang">Cabang</Label>
              <Input
                id="cabang"
                value={formData.cabang}
                onChange={(e) => setFormData({ ...formData, cabang: e.target.value })}
                placeholder="Nama cabang"
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Cabang otomatis diisi berdasarkan konfigurasi sistem
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama_project">Nama Project</Label>
              <Input
                id="nama_project"
                value={formData.nama_project}
                onChange={(e) => setFormData({ ...formData, nama_project: e.target.value })}
                placeholder="Masukkan nama project"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleCreateProject} disabled={isAdding}>
              {isAdding ? 'Membuat...' : 'Buat Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectBaru;
