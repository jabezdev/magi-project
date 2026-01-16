const merged = { ...existing, ...req.body }
fs.writeFileSync(settingsPath, JSON.stringify(merged, null, 2))
res.json({ success: true })
        } catch (error) {
    console.error('Failed to save settings:', error)
    res.status(500).json({ error: 'Failed to save settings' })
}
    })

return router
}
