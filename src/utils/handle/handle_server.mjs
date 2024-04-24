export function handleServerError(res, error) {
    console.error(error);
    return res.status(500).json({
        success: false,
        message: 'Error del servidor'
    });
}