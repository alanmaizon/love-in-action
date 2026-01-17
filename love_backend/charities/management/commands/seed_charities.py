from django.core.management.base import BaseCommand
from charities.models import Charity


CHARITIES = [
    {
        'name': 'Barretstown',
        'slug': 'barretstown',
        'description': 'Providing free, specially designed camps and programmes for children and their families living with a serious illness.',
        'website': 'https://www.barretstown.org',
        'registration_number': 'CHY12385',
        'category': 'children',
        'logo': 'https://www.barretstown.org/logo.png',
    },
    {
        'name': 'Irish Cancer Society',
        'slug': 'irish-cancer-society',
        'description': 'Working to prevent cancer, save lives and improve the lives of those affected by cancer.',
        'website': 'https://www.cancer.ie',
        'registration_number': 'CHY5863',
        'category': 'health',
        'logo': 'https://www.cancer.ie/logo.png',
    },
    {
        'name': 'ISPCA',
        'slug': 'ispca',
        'description': 'The Irish Society for the Prevention of Cruelty to Animals works to prevent cruelty to animals.',
        'website': 'https://www.ispca.ie',
        'registration_number': 'CHY5619',
        'category': 'animals',
        'logo': 'https://www.ispca.ie/logo.png',
    },
    {
        'name': 'Simon Communities',
        'slug': 'simon-communities',
        'description': 'Preventing and addressing homelessness across Ireland.',
        'website': 'https://www.simon.ie',
        'registration_number': 'CHY5477',
        'category': 'homelessness',
        'logo': 'https://www.simon.ie/logo.png',
    },
    {
        'name': 'Pieta House',
        'slug': 'pieta-house',
        'description': 'Providing free therapy to those engaging in self-harm, with suicidal ideation, or bereaved by suicide.',
        'website': 'https://www.pieta.ie',
        'registration_number': 'CHY16084',
        'category': 'mental_health',
        'logo': 'https://www.pieta.ie/logo.png',
    },
    {
        'name': 'Concern Worldwide',
        'slug': 'concern-worldwide',
        'description': "Working to transform the lives of the world's poorest people.",
        'website': 'https://www.concern.net',
        'registration_number': 'CHY5745',
        'category': 'international',
        'logo': 'https://www.concern.net/logo.png',
    },
    {
        'name': 'LauraLynn',
        'slug': 'lauralynn',
        'description': "Ireland's only children's hospice, providing palliative care for children with life-limiting conditions.",
        'website': 'https://www.lauralynn.ie',
        'registration_number': 'CHY16010',
        'category': 'children',
        'logo': 'https://www.lauralynn.ie/logo.png',
    },
    {
        'name': 'Barnardos Ireland',
        'slug': 'barnardos',
        'description': 'Working with vulnerable children and their families to transform their lives.',
        'website': 'https://www.barnardos.ie',
        'registration_number': 'CHY6015',
        'category': 'children',
        'logo': 'https://www.barnardos.ie/logo.png',
    },
    {
        'name': 'Irish Hospice Foundation',
        'slug': 'irish-hospice-foundation',
        'description': 'Supporting people in Ireland through dying, death, and bereavement.',
        'website': 'https://hospicefoundation.ie',
        'registration_number': 'CHY6830',
        'category': 'health',
        'logo': 'https://hospicefoundation.ie/logo.png',
    },
    {
        'name': 'Temple Street Foundation',
        'slug': 'temple-street',
        'description': "Supporting Children's Health Ireland at Temple Street to provide world-class care.",
        'website': 'https://www.templestreet.ie',
        'registration_number': 'CHY7492',
        'category': 'children',
        'logo': 'https://www.templestreet.ie/logo.png',
    },
]


class Command(BaseCommand):
    help = 'Seed the database with Irish charities'

    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0

        for charity_data in CHARITIES:
            charity, created = Charity.objects.update_or_create(
                slug=charity_data['slug'],
                defaults={
                    'name': charity_data['name'],
                    'description': charity_data['description'],
                    'website': charity_data['website'],
                    'registration_number': charity_data['registration_number'],
                    'category': charity_data['category'],
                    'logo': charity_data.get('logo', ''),
                    'is_verified': True,
                    'is_active': True,
                }
            )

            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Created: {charity.name}'))
            else:
                updated_count += 1
                self.stdout.write(f'Updated: {charity.name}')

        self.stdout.write(self.style.SUCCESS(
            f'\nDone! Created {created_count}, updated {updated_count} charities.'
        ))
