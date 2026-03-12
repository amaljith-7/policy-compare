from django.core.management.base import BaseCommand
from core.models import Role


class Command(BaseCommand):
    help = 'Seed default roles'

    def handle(self, *args, **options):
        roles = [
            {
                'name': 'Admin',
                'permissions': {
                    'quotes.view': True, 'quotes.create': True, 'quotes.edit': True, 'quotes.delete': True, 'quotes.share': True,
                    'insurers.view': True, 'insurers.manage': True,
                    'users.view': True, 'users.manage': True,
                    'roles.view': True, 'roles.manage': True,
                    'dashboard.view': True,
                },
                'is_default': False,
            },
            {
                'name': 'Agent',
                'permissions': {
                    'quotes.view': True, 'quotes.create': True, 'quotes.edit': True, 'quotes.delete': False, 'quotes.share': True,
                    'insurers.view': True, 'insurers.manage': False,
                    'users.view': False, 'users.manage': False,
                    'roles.view': False, 'roles.manage': False,
                    'dashboard.view': True,
                },
                'is_default': True,
            },
            {
                'name': 'Viewer',
                'permissions': {
                    'quotes.view': True, 'quotes.create': False, 'quotes.edit': False, 'quotes.delete': False, 'quotes.share': False,
                    'insurers.view': True, 'insurers.manage': False,
                    'users.view': False, 'users.manage': False,
                    'roles.view': False, 'roles.manage': False,
                    'dashboard.view': True,
                },
                'is_default': False,
            },
        ]
        for role_data in roles:
            role, created = Role.objects.update_or_create(
                name=role_data['name'],
                defaults=role_data,
            )
            status = 'Created' if created else 'Updated'
            self.stdout.write(f'{status} role: {role.name}')
