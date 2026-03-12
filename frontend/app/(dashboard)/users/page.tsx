'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserTable } from '@/components/users/user-table';
import { RoleTable } from '@/components/users/role-table';

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User Management</h1>
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4">
          <UserTable />
        </TabsContent>
        <TabsContent value="roles" className="mt-4">
          <RoleTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
