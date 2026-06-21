import java.io.File
import org.apache.tools.ant.taskdefs.condition.Os
import org.gradle.api.DefaultTask
import org.gradle.api.GradleException
import org.gradle.api.logging.LogLevel
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.TaskAction

open class BuildTask : DefaultTask() {
    @Input
    var rootDirRel: String? = null
    @Input
    var target: String? = null
    @Input
    var release: Boolean? = null

    @TaskAction
    fun assemble() {
        val rootDirRel = rootDirRel ?: throw GradleException("rootDirRel cannot be null")
        val target = target ?: throw GradleException("target cannot be null")
        val release = release ?: throw GradleException("release cannot be null")

        // Map Rust target to Android ABI
        val abi = when (target) {
            "aarch64" -> "arm64-v8a"
            "armv7" -> "armeabi-v7a"
            "i686" -> "x86"
            "x86_64" -> "x86_64"
            else -> throw GradleException("Unknown target: $target")
        }

        val profile = if (release) "release" else "debug"
        val soFile = File(project.projectDir, "$rootDirRel/target/${rustTriple(target)}/$profile/libapp_lib.so")
        val jniLibsDir = File(project.projectDir, "src/main/jniLibs/$abi")
        val destFile = File(jniLibsDir, "libapp_lib.so")

        // Check if .so is already up-to-date - skip Tauri CLI if so
        if (destFile.exists() && soFile.exists() && destFile.lastModified() >= soFile.lastModified()) {
            project.logger.lifecycle("Skipping Rust build: $destFile is up-to-date")
            return
        }

        // Build Rust via Tauri CLI
        val executable = """pnpm""";
        try {
            runTauriCli(executable)
        } catch (e: Exception) {
            if (Os.isFamily(Os.FAMILY_WINDOWS)) {
                val fallbacks = listOf(
                    "$executable.exe",
                    "$executable.cmd",
                    "$executable.bat",
                )
                
                var lastException: Exception = e
                for (fallback in fallbacks) {
                    try {
                        runTauriCli(fallback)
                        // On Windows, if symlink failed, copy the file manually
                        if (!destFile.exists() && soFile.exists()) {
                            jniLibsDir.mkdirs()
                            soFile.copyTo(destFile, overwrite = true)
                            project.logger.lifecycle("Copied $soFile to $destFile (symlink fallback)")
                        }
                        return
                    } catch (fallbackException: Exception) {
                        lastException = fallbackException
                    }
                }
                throw lastException
            } else {
                throw e;
            }
        }

        // On Windows, if symlink failed, copy the file manually
        if (!destFile.exists() && soFile.exists()) {
            jniLibsDir.mkdirs()
            soFile.copyTo(destFile, overwrite = true)
            project.logger.lifecycle("Copied $soFile to $destFile (symlink fallback)")
        }
    }

    fun rustTriple(target: String): String {
        return when (target) {
            "aarch64" -> "aarch64-linux-android"
            "armv7" -> "armv7-linux-androideabi"
            "i686" -> "i686-linux-android"
            "x86_64" -> "x86_64-linux-android"
            else -> throw GradleException("Unknown target: $target")
        }
    }

    fun runTauriCli(executable: String) {
        val rootDirRel = rootDirRel ?: throw GradleException("rootDirRel cannot be null")
        val target = target ?: throw GradleException("target cannot be null")
        val release = release ?: throw GradleException("release cannot be null")
        val args = mutableListOf("tauri", "android", "android-studio-script");

        project.exec {
            workingDir(File(project.projectDir, rootDirRel))
            executable(executable)
            args(args)
            if (project.logger.isEnabled(LogLevel.DEBUG)) {
                args("-vv")
            } else if (project.logger.isEnabled(LogLevel.INFO)) {
                args("-v")
            }
            if (release) {
                args("--release")
            }
            args(listOf("--target", target))
        }.assertNormalExitValue()
    }
}