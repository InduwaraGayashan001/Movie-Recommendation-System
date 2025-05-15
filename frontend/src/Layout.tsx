import { Box, Container, Paper, Typography } from '@mui/material'
import LocalMoviesIcon from '@mui/icons-material/LocalMovies'

export function Header() {
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(30, 30, 30, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 64, 129, 0.2)',
        width: '100%'
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          py: 2,
          height: '64px'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalMoviesIcon 
              sx={{ 
                fontSize: 40,
                color: 'primary.main',
                filter: 'drop-shadow(0 0 8px rgba(255, 64, 129, 0.5))'
              }} 
            />
            <Typography 
              variant="h4" 
              component="h1"
              sx={{ 
                background: 'linear-gradient(45deg, #FF4081 30%, #FF9100 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold',
                letterSpacing: '0.05em'
              }}
            >
              CineMatch
            </Typography>
          </Box>
        </Box>
      </Container>
    </Paper>
  )
}

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundSize: '100% auto',
        backgroundPosition: 'top center',
        backgroundAttachment: 'fixed',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("/images/image.png")',
          backgroundSize: '100% auto',
          backgroundPosition: 'top center',
          backgroundRepeat: 'repeat-y',
          opacity: 0.50,
          zIndex: 0,
        },
      }}
    >
      <Header />
      <Box sx={{ pt: '80px', position: 'relative', zIndex: 1 }}>
        {children}
      </Box>
    </Box>
  )
}

export default Layout 