from django.test import TestCase
from django.urls import reverse

class LightReflectionTests(TestCase):
    def test_light_reflection_view(self):
        """测试光的反射视图是否能正常访问"""
        response = self.client.get(reverse('light_reflection'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'light_reflection/light-reflection.html')
