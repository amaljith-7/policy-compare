from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from .serializers import LoginSerializer, UserSerializer


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        data = serializer.data
        if request.user.is_superuser:
            # Superusers get all permissions
            data['permissions'] = {
                'quotes.view': True, 'quotes.create': True, 'quotes.edit': True,
                'quotes.delete': True, 'quotes.share': True,
                'insurers.view': True, 'insurers.manage': True,
                'users.view': True, 'users.manage': True,
                'roles.view': True, 'roles.manage': True,
                'dashboard.view': True,
            }
            data['is_superuser'] = True
        elif request.user.role:
            data['permissions'] = request.user.role.permissions
        else:
            data['permissions'] = {}
        return Response(data)
